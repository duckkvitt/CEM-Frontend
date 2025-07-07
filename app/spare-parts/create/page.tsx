import { CreateSparePartForm } from "../components/create-spare-part-form";

export default function CreateSparePartPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center mb-4">
        <h1 className="font-semibold text-lg md:text-2xl">Create New Spare Part</h1>
      </div>
      <div className="border rounded-lg p-6">
        <CreateSparePartForm />
      </div>
    </main>
  );
} 