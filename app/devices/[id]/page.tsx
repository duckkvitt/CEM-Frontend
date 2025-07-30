'use client'

import Sidebar from '@/components/sidebar'
import { Button } from '@/components/ui/button'
import { DEVICE_SERVICE_URL } from '@/lib/api'
import { getAccessToken, getCurrentUserRole } from '@/lib/auth'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Device {
  id: number
  name: string
  model?: string
  serialNumber?: string
  warrantyExpiry?: string
  quantity?: number
  price?: number
  unit?: string
  status: string
  createdAt?: string
  updatedAt?: string
}

interface DeviceNote {
  id: number
  deviceId: number
  note: string
  createdAt: string
  createdBy?: string
}

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
  status?: number
  errors?: unknown
}

export default function DeviceDetailPage () {
  const router = useRouter()
  const params = useParams()
  const deviceId = params?.id as string | undefined
  const role = getCurrentUserRole()

  const [device, setDevice] = useState<Device | null>(null)
  const [notes, setNotes] = useState<DeviceNote[]>([])
  const [loading, setLoading] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const fetchDetails = async () => {
    if (!deviceId) return
    setLoading(true)
    try {
      const [deviceRes, notesRes] = await Promise.all([
        fetch(`${DEVICE_SERVICE_URL}/devices/${deviceId}`, {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
          cache: 'no-store'
        }),
        fetch(`${DEVICE_SERVICE_URL}/devices/${deviceId}/notes`, {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
          cache: 'no-store'
        })
      ])
      const deviceJson: ApiResponse<Device> = await deviceRes.json()
      const notesJson: ApiResponse<DeviceNote[] | unknown> = await notesRes.json()
      if (!deviceJson.success) throw new Error(deviceJson.message || 'Failed to fetch device')
      if (!notesJson.success) throw new Error(notesJson.message || 'Failed to fetch notes')
      setDevice(deviceJson.data)
      if (Array.isArray(notesJson.data)) {
        setNotes(notesJson.data as DeviceNote[])
      } else {
        // handle paginated maybe
        // note data could be Page type; for now handle both
        // @ts-ignore
        if (notesJson.data?.content) setNotes(notesJson.data.content)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDetails()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId])

  const addNote = async () => {
    if (!noteText.trim()) return
    try {
      const res = await fetch(`${DEVICE_SERVICE_URL}/devices/${deviceId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAccessToken()}`
        },
        body: JSON.stringify({ note: noteText.trim() })
      })
      const json: ApiResponse<DeviceNote> = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed to add note')
      setNoteText('')
      fetchDetails()
    } catch (err) {
      alert((err as Error).message)
    }
  }

  const deleteNote = async (noteId: number) => {
    if (!confirm('Delete this note?')) return
    try {
      const res = await fetch(`${DEVICE_SERVICE_URL}/devices/${deviceId}/notes/${noteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAccessToken()}` }
      })
      const json: ApiResponse<string> = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed to delete note')
      fetchDetails()
    } catch (err) {
      alert((err as Error).message)
    }
  }

  if (loading || !device) {
    return (
      <div className='flex items-center justify-center min-h-[60vh]'>
        {loading ? 'Loading…' : error || 'Device not found'}
      </div>
    )
  }

  // Sửa layout: bỏ flex, Sidebar, ml-60, chỉ để content trong 1 div
  return (
    <div>
      <div className='flex items-center gap-4 mb-6'>
        <Button variant='ghost' onClick={() => router.back()}>&larr; Back</Button>
        <h1 className='text-2xl font-semibold'>Device #{device.id}</h1>
        {role === 'STAFF' && (
          <Link href={`/devices/${device.id}/edit`} className='underline'>Edit</Link>
        )}
      </div>
      <section className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
        <div>
          <h2 className='font-semibold mb-2'>General</h2>
          <ul className='space-y-1 text-sm'>
            <li><strong>Name:</strong> {device.name}</li>
            <li><strong>Model:</strong> {device.model || '-'}</li>
            <li><strong>Serial #:</strong> {device.serialNumber || '-'}</li>
            <li><strong>Quantity:</strong> {device.quantity ?? '-'}</li>
            <li><strong>Price:</strong> {device.price ? `${device.price.toLocaleString()} VND` : '-'}</li>
            <li><strong>Unit:</strong> {device.unit || '-'}</li>
            <li><strong>Status:</strong> {device.status}</li>
          </ul>
        </div>
        <div>
          <h2 className='font-semibold mb-2'>Additional</h2>
          <ul className='space-y-1 text-sm'>
            {/* Xóa Customer ID */}
            <li><strong>Warranty Expiry:</strong> {device.warrantyExpiry || '-'}</li>
            <li><strong>Created At:</strong> {device.createdAt || '-'}</li>
            <li><strong>Updated At:</strong> {device.updatedAt || '-'}</li>
          </ul>
        </div>
      </section>

      <section>
        <div className='flex items-center justify-between mb-2'>
          <h2 className='text-xl font-semibold'>Notes</h2>
        </div>
        {role === 'STAFF' && (
          <div className='flex gap-2 mb-4'>
            <input
              placeholder='Add a note…'
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              className='flex-1 border rounded-md px-3 h-10'
            />
            <Button onClick={addNote}>Add</Button>
          </div>
        )}
        {notes.length === 0 ? (
          <p className='text-sm text-muted-foreground'>No notes yet.</p>
        ) : (
          <ul className='space-y-3'>
            {notes.map(n => (
              <li key={n.id} className='border rounded-md p-3 flex justify-between items-start'>
                <div>
                  <p className='text-sm whitespace-pre-line'>{n.note}</p>
                  <p className='text-xs text-muted-foreground mt-1'>By {n.createdBy || 'Unknown'} on {new Date(n.createdAt).toLocaleString()}</p>
                </div>
                {role === 'STAFF' && (
                  <button onClick={() => deleteNote(n.id)} className='text-red-600 text-xs underline ml-4'>Delete</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
} 