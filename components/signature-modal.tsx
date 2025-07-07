'use client';

import { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSign: (signature: string) => void;
  loading: boolean;
}

export function SignatureModal({ isOpen, onClose, onSign, loading }: SignatureModalProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const clearCanvas = () => {
    sigCanvas.current?.clear();
    setIsEmpty(true);
  };

  const handleConfirm = () => {
    if (sigCanvas.current?.isEmpty()) {
      alert('Please provide a signature.');
      return;
    }
    const signatureImage = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
    if (signatureImage) {
      onSign(signatureImage);
    }
  };

  const handleOnEnd = () => {
    setIsEmpty(sigCanvas.current?.isEmpty() ?? true);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Please Sign Below</DialogTitle>
          <DialogDescription>
            Draw your signature in the box. Click 'Clear' to start over.
          </DialogDescription>
        </DialogHeader>
        <div className="relative w-full h-64 bg-gray-100 rounded-md border-2 border-dashed">
          <SignatureCanvas
            ref={sigCanvas}
            penColor="black"
            canvasProps={{ className: 'w-full h-full' }}
            onEnd={handleOnEnd}
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={clearCanvas}>
            Clear
          </Button>
          <Button onClick={handleConfirm} disabled={loading || isEmpty}>
            {loading ? 'Submitting...' : 'Confirm & Sign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 