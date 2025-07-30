'use client';

import { useEffect, useState, use } from 'react';
import { EditSparePartForm } from "../../components/edit-spare-part-form";
import { getSparePartById } from "@/lib/spare-parts";
import { SparePart } from "@/types/spare-part";

export default function EditSparePartPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = Number(resolvedParams.id);
  const [part, setPart] = useState<SparePart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPart() {
      try {
        const data = await getSparePartById(id);
        setPart(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load spare part');
      } finally {
        setLoading(false);
      }
    }

    fetchPart();
  }, [id]);

  if (loading) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading spare part...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !part) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="rounded-md bg-red-50 p-6 text-center">
          <h3 className="text-lg font-medium text-red-800">Error</h3>
          <p className="mt-2 text-red-700">
            {error || 'Spare part not found'}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center mb-4">
        <h1 className="font-semibold text-lg md:text-2xl">Edit Spare Part</h1>
      </div>
      <div className="border rounded-lg p-6">
        <EditSparePartForm part={part} />
      </div>
    </main>
  );
} 