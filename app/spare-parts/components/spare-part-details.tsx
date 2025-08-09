'use client';

import { useEffect, useState } from 'react';
import { getSparePartById } from '@/lib/spare-parts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SparePart } from '@/types/spare-part';

export function SparePartDetails({ id }: { id: number }) {
  const [part, setPart] = useState<SparePart | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getSparePartById(id);
        setPart(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unexpected error');
      }
    })();
  }, [id]);

  if (error) return <p className="text-red-500">Failed to load: {error}</p>;
  if (!part) return <p>Loading...</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{part.partName}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <strong>Part Code:</strong> {part.partCode}
          </div>
          <div>
            <strong>Status:</strong>{' '}
            <Badge variant={part.status === 'ACTIVE' ? 'default' : 'destructive'}>
              {part.status}
            </Badge>
          </div>
          <div>
            <strong>Unit of Measurement:</strong> {part.unitOfMeasurement}
          </div>
          <div>
            <strong>Compatible Devices:</strong> {part.compatibleDevices || 'N/A'}
          </div>
        </div>
        <div>
          <strong>Description:</strong>
          <p className="text-sm text-muted-foreground">
            {part.description || 'No description provided.'}
          </p>
        </div>
        <div className="text-xs text-muted-foreground pt-4">
          <div>Created At: {new Date(part.createdAt).toLocaleString()}</div>
          <div>Last Updated: {new Date(part.updatedAt).toLocaleString()}</div>
        </div>
      </CardContent>
    </Card>
  );
} 