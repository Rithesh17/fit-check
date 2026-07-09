import { Suspense } from "react";
import { ResetForm } from "@/components/auth/ResetForm";

export default function ResetPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
