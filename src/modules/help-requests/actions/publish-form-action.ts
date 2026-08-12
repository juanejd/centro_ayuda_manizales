"use server";

import {
  publishHelpRequest,
  type PublishHelpRequestResult,
} from "@/modules/help-requests/actions/publish";

// useActionState needs an action React recognizes as a real Server Action
// (not a client-defined wrapper) to correctly infer method="post" and
// encType="multipart/form-data" for the bound <form> during SSR — a plain
// client-side adapter function loses that inference and silently drops both
// attributes, breaking submission with JavaScript disabled.
export async function publishFormAction(
  _prevState: PublishHelpRequestResult | null,
  formData: FormData,
): Promise<PublishHelpRequestResult | null> {
  return publishHelpRequest(formData);
}
