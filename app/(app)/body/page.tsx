import { redirect } from "next/navigation";

// Body metrics now live under the account area.
export default function BodyRedirect() {
  redirect("/account");
}
