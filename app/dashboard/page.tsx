'use client'

export default function DashboardPage () {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Heading 1 - spans 4 columns on large, 3 on md */}
        <div className="col-span-1 md:col-span-3 lg:col-span-4 h-60 rounded-lg bg-muted/60 flex items-start justify-start p-4">
          <span className="font-semibold text-lg">HEADING 1</span>
        </div>
        {/* Heading 2 */}
        <div className="col-span-1 md:col-span-3 lg:col-span-2 h-60 rounded-lg bg-muted/60 flex items-start justify-start p-4">
          <span className="font-semibold text-lg">HEADING 2</span>
        </div>
        {/* Heading 3 */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2 h-60 rounded-lg bg-muted/60 flex items-start justify-start p-4">
          <span className="font-semibold text-lg">HEADING 3</span>
        </div>
        {/* Heading 4 */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2 h-60 rounded-lg bg-muted/60 flex items-start justify-start p-4">
          <span className="font-semibold text-lg">HEADING 4</span>
        </div>
        {/* Heading 5 */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2 h-60 rounded-lg bg-muted/60 flex items-start justify-start p-4">
          <span className="font-semibold text-lg">HEADING 5</span>
        </div>
      </div>
    </div>
  )
} 