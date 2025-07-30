'use client';

import { useState, useTransition } from 'react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { hideSparePart } from '@/lib/spare-parts';
import { toast } from 'sonner';

export function HideSparePartButton({ id }: { id: number }) {
  const [isPending, startTransition] = useTransition();

  const handleHide = () => {
    startTransition(async () => {
      try {
        const result = await hideSparePart(id);
        if (result) {
          toast.success(result);
        } else {
          toast.success('Spare part hidden successfully');
        }
        // Refresh the page to update the list
        window.location.reload();
      } catch (error) {
        console.error('Error hiding spare part:', error);
        const message = error instanceof Error ? error.message : 'Failed to hide spare part';
        toast.error(message);
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          Hide
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will mark the spare part as inactive and hide it from the default list view.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleHide} disabled={isPending}>
            {isPending ? 'Hiding...' : 'Confirm'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 