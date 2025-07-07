import { EditSparePartForm } from "../../components/edit-spare-part-form";
import { getSparePartById } from "@/lib/spare-parts";
import { Suspense } from "react";

export default async function EditSparePartPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const part = await getSparePartById(id);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center mb-4">
        <h1 className="font-semibold text-lg md:text-2xl">Edit Spare Part</h1>
      </div>
      <div className="border rounded-lg p-6">
        <Suspense fallback={<div>Loading form...</div>}>
          <EditSparePartForm part={part} />
        </Suspense>
      </div>
    </main>
  );
} 