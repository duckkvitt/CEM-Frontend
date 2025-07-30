import { use } from "react";
import { SparePartDetails } from "../components/spare-part-details";
import { Suspense } from "react";

export default function ViewSparePartPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = Number(resolvedParams.id);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <Suspense fallback={<div>Loading details...</div>}>
        <SparePartDetails id={id} />
      </Suspense>
    </main>
  );
} 