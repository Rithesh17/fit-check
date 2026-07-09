import { Suspense } from "react";
import { ForgotForm } from "@/components/auth/ForgotForm";

export default function ForgotPage() {
  return (
    <Suspense>
      <ForgotForm />
    </Suspense>
  );
}
