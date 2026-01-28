import { Suspense } from "react";
import UseCaseDetailClient from "./UseCaseDetailClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="container mx-auto py-8 px-4">Loading…</div>}>
      <UseCaseDetailClient />
    </Suspense>
  );
}
