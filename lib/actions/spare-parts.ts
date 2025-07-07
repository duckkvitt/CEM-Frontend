'use server';

import { z } from 'zod';
import { createSparePartSchema, updateSparePartSchema } from '@/lib/schemas';
import {
  createSparePart as apiCreateSparePart,
  updateSparePart as apiUpdateSparePart,
  hideSparePart as apiHideSparePart,
} from '@/lib/spare-parts';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export type FormState = {
  message: string;
  errors?: Record<string, string[] | undefined>;
  success: boolean;
};

export async function createSparePartAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = createSparePartSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      message: 'Validation failed. Please check the fields.',
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  try {
    await apiCreateSparePart(validatedFields.data);
  } catch (error: any) {
    return {
      message: `Failed to create spare part: ${error.message}`,
      success: false,
    };
  }

  revalidatePath('/spare-parts');
  redirect('/spare-parts');
  
  // This part is not reachable due to redirect, but good for type safety
  return {
      message: 'Spare part created successfully!',
      success: true,
  }
}

export async function updateSparePartAction(
    id: number,
    prevState: FormState,
    formData: FormData
): Promise<FormState> {
    const validatedFields = updateSparePartSchema.safeParse(
        Object.fromEntries(formData.entries())
    );

    if (!validatedFields.success) {
        return {
            message: 'Validation failed. Please check the fields.',
            errors: validatedFields.error.flatten().fieldErrors,
            success: false,
        };
    }

    try {
        await apiUpdateSparePart(id, validatedFields.data);
    } catch (error: any) {
        return {
            message: `Failed to update spare part: ${error.message}`,
            success: false,
        };
    }

    revalidatePath('/spare-parts');
    revalidatePath(`/spare-parts/${id}`);
    redirect(`/spare-parts/${id}`);

    return {
        message: 'Spare part updated successfully!',
        success: true,
    };
}

export async function hideSparePartAction(id: number): Promise<FormState> {
    try {
        await apiHideSparePart(id);
    } catch (error: any) {
        return {
            message: `Failed to hide spare part: ${error.message}`,
            success: false,
        };
    }

    revalidatePath('/spare-parts');
    
    return {
        message: 'Spare part hidden successfully!',
        success: true,
    };
} 