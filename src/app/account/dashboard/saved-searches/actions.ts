
"use server";

import { deleteSavedSearchAction as deleteAction } from "@/app/search/actions";

export async function deleteSavedSearch(formData: FormData) {
  const result = await deleteAction(formData);
  if (result?.error) {
    // Handle error case, maybe log it or re-throw
    console.error(result.error);
  }
}
