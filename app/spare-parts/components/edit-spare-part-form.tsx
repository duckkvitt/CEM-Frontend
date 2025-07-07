'use client';

import { useFormState } from 'react-dom';
import { updateSparePartAction } from '@/lib/actions/spare-parts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SparePart } from '@/types/spare-part';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const initialState = {
  message: '',
  errors: {},
  success: false,
};

export function EditSparePartForm({ part }: { part: SparePart }) {
  const updateAction = updateSparePartAction.bind(null, part.id);
  const [state, formAction] = useFormState(updateAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="partName">Part Name</Label>
          <Input id="partName" name="partName" defaultValue={part.partName} />
          {state.errors?.partName && <p className="text-sm text-red-500">{state.errors.partName.join(', ')}</p>}
        </div>
        <div>
          <Label htmlFor="quantityInStock">Quantity in Stock</Label>
          <Input id="quantityInStock" name="quantityInStock" type="number" defaultValue={part.quantityInStock} />
           {state.errors?.quantityInStock && <p className="text-sm text-red-500">{state.errors.quantityInStock.join(', ')}</p>}
        </div>
        <div>
          <Label htmlFor="unitOfMeasurement">Unit of Measurement</Label>
          <Input id="unitOfMeasurement" name="unitOfMeasurement" defaultValue={part.unitOfMeasurement} />
           {state.errors?.unitOfMeasurement && <p className="text-sm text-red-500">{state.errors.unitOfMeasurement.join(', ')}</p>}
        </div>
        <div>
            <Label htmlFor="compatibleDevices">Compatible Devices</Label>
            <Input id="compatibleDevices" name="compatibleDevices" defaultValue={part.compatibleDevices} />
            {state.errors?.compatibleDevices && <p className="text-sm text-red-500">{state.errors.compatibleDevices.join(', ')}</p>}
        </div>
        <div>
            <Label htmlFor="supplier">Supplier (optional)</Label>
            <Input id="supplier" name="supplier" defaultValue={part.supplier} />
            {state.errors?.supplier && <p className="text-sm text-red-500">{state.errors.supplier.join(', ')}</p>}
        </div>
         <div>
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={part.status}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
           {state.errors?.status && <p className="text-sm text-red-500">{state.errors.status.join(', ')}</p>}
        </div>
      </div>
       <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={part.description} />
             {state.errors?.description && <p className="text-sm text-red-500">{state.errors.description.join(', ')}</p>}
        </div>
      
      <Button type="submit">Save Changes</Button>

      {!state.success && state.message && <p className="text-sm text-red-500">{state.message}</p>}
    </form>
  );
} 