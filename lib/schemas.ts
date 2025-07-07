import { z } from 'zod';

export const createSparePartSchema = z.object({
  partName: z.string().min(1, 'Part name is required').max(255),
  partCode: z.string().min(1, 'Part code is required').max(255),
  description: z.string().optional(),
  compatibleDevices: z.string().max(255).optional(),
  quantityInStock: z.coerce.number().int().min(0, 'Quantity must be non-negative'),
  unitOfMeasurement: z.string().min(1, 'Unit of measurement is required').max(255),
  supplier: z.string().max(255).optional(),
});

export const updateSparePartSchema = z.object({
  partName: z.string().min(1, 'Part name is required').max(255).optional(),
  description: z.string().optional(),
  compatibleDevices: z.string().max(255).optional(),
  quantityInStock: z.coerce.number().int().min(0, 'Quantity must be non-negative').optional(),
  unitOfMeasurement: z.string().min(1, 'Unit of measurement is required').max(255).optional(),
  supplier: z.string().max(255).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
}); 