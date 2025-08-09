'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSparePart } from '@/lib/spare-parts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function CreateSparePartForm() {
  const router = useRouter();

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setMessage('');

    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      // Basic client-side validation
      if (!payload.partName) {
        setErrors({ partName: ['Part name is required'] });
        setSubmitting(false);
        return;
      }

      await createSparePart({
        partName: payload.partName as string,
        partCode: payload.partCode as string,
        description: payload.description as string,
        compatibleDevices: payload.compatibleDevices as string,
        unitOfMeasurement: payload.unitOfMeasurement as string,
      });

      router.push('/spare-parts');
    } catch (err: unknown) {
      setMessage(
        err instanceof Error ? `Failed to create spare part: ${err.message}` : 'Unexpected error'
      );
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="partName">Part Name</Label>
          <Input id="partName" name="partName" />
          {errors?.partName && <p className="text-sm text-red-500">{errors.partName.join(', ')}</p>}
        </div>
        <div>
          <Label htmlFor="partCode">Part Code / SKU</Label>
          <Input id="partCode" name="partCode" />
          {errors?.partCode && <p className="text-sm text-red-500">{errors.partCode.join(', ')}</p>}
        </div>
        <div>
          <Label htmlFor="unitOfMeasurement">Unit of Measurement</Label>
          <Input id="unitOfMeasurement" name="unitOfMeasurement" placeholder="e.g., piece, set" />
           {errors?.unitOfMeasurement && <p className="text-sm text-red-500">{errors.unitOfMeasurement.join(', ')}</p>}
        </div>
        <div>
            <Label htmlFor="compatibleDevices">Compatible Devices</Label>
            <Input id="compatibleDevices" name="compatibleDevices" placeholder="e.g., Model X, Model Y" />
            {errors?.compatibleDevices && <p className="text-sm text-red-500">{errors.compatibleDevices.join(', ')}</p>}
        </div>
      </div>
       <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" />
             {errors?.description && <p className="text-sm text-red-500">{errors.description.join(', ')}</p>}
        </div>
      
      <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Spare Part'}</Button>

      {message && <p className="text-sm text-red-500">{message}</p>}
    </form>
  );
} 