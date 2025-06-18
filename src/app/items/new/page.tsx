import { createClient } from "../../utils/supabase/server";
import { redirect } from "next/navigation";
import NewItemForm from "./NewItemForm";

export default async function NewItemPageProtected() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // If no user, redirect to the login page
    return redirect("/auth");
  }

  // If there is a user, render the form and pass the user object to it
  return <NewItemForm user={user} />;
}