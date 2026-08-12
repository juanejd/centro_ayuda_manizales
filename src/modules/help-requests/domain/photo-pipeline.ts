import sharp from "sharp";

// RF-1.9's client-side target is ~500 KB; this server-side pass is a
// best-effort re-encode, not an iterative bisection loop toward that number.
const MAX_DIMENSION_PX = 1600;
const JPEG_QUALITY = 75;

const ACCEPTED_FORMATS = new Set(["jpeg", "png", "webp"]);

export class InvalidPhotoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPhotoError";
  }
}

/**
 * RF-1.11 / RNF-5.7: strips ALL metadata (including EXIF GPS) before a photo
 * is ever written to storage. This is the single most consequential function
 * in this phase — an unstripped photo publishes the exact GPS coordinates of
 * someone's dwelling, defeating the coordinate rounding done elsewhere.
 *
 * How the strip actually happens: sharp drops all metadata by default unless
 * `.withMetadata()` is called on the pipeline. This function never calls it.
 * Do not add it later without re-verifying the EXIF-stripping guarantee this
 * function exists to provide.
 *
 * Validates the REAL file type by letting sharp decode it — a renamed text
 * file or any other non-image buffer throws InvalidPhotoError, not sharp's
 * raw decode error. Only jpeg/png/webp (as reported by sharp's own decoder,
 * never a filename or a declared MIME type) are accepted.
 */
export async function processHelpRequestPhoto(input: Buffer): Promise<Buffer> {
  let format: string | undefined;

  try {
    const metadata = await sharp(input).metadata();
    format = metadata.format;
  } catch {
    throw new InvalidPhotoError(
      "The uploaded file is not a decodable image.",
    );
  }

  if (!format || !ACCEPTED_FORMATS.has(format)) {
    throw new InvalidPhotoError(
      `Unsupported image format: ${format ?? "unknown"}. Only JPEG, PNG, and WebP are accepted.`,
    );
  }

  return sharp(input)
    .rotate() // Consumes the EXIF orientation tag, then discards it.
    .resize({
      width: MAX_DIMENSION_PX,
      height: MAX_DIMENSION_PX,
      fit: "inside",
      withoutEnlargement: true,
    })
    // No .withMetadata() call, deliberately: sharp strips all metadata
    // (EXIF, ICC, XMP, IPTC — including GPS) by default when it is absent.
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();
}
