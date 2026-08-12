import { randomInt } from "node:crypto";

// Crockford base32 minus I, L, O, U: avoids both visual ambiguity (1/I/l,
// 0/O) and accidental words. Must stay byte-for-byte identical to the CHECK
// constraint on help_requests.reference_code in
// supabase/migrations/20260811072658_initial_schema.sql — the two are the
// same alphabet enforced twice, once here and once by Postgres.
const REFERENCE_CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const REFERENCE_CODE_LENGTH = 8;

export const REFERENCE_CODE_PATTERN = /^[0-9A-HJKMNPQRSTVWXYZ]{8}$/;

/**
 * Generates one candidate 8-character reference code from a
 * cryptographically-random source (crypto.randomInt, never Math.random).
 *
 * Pure: does not touch the database and does not know about uniqueness.
 * reference_code is UNIQUE at the database level, so the caller (the publish
 * Server Action, unit 4.4) is responsible for the retry-on-collision loop:
 * attempt an INSERT with a freshly generated code, and on a Postgres
 * unique-violation (23505) naming this constraint, call this function again
 * for a new candidate.
 */
export function generateReferenceCode(): string {
  let code = "";

  for (let i = 0; i < REFERENCE_CODE_LENGTH; i += 1) {
    const index = randomInt(REFERENCE_CODE_ALPHABET.length);
    code += REFERENCE_CODE_ALPHABET[index];
  }

  return code;
}
