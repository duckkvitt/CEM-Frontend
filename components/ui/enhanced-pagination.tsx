'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious,
  PaginationEllipsis
} from '@/components/ui/pagination'
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  MoreHorizontal
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface EnhancedPaginationProps {
  currentPage: number
  totalPages: number
  totalElements: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  loading?: boolean
  className?: string
  showPageSizeSelector?: boolean
  showJumpToPage?: boolean
  showTotalInfo?: boolean
  pageSizeOptions?: number[]
}

const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100]

export function EnhancedPagination({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onPageSizeChange,
  loading = false,
  className = '',
  showPageSizeSelector = true,
  showJumpToPage = true,
  showTotalInfo = true,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS
}: EnhancedPaginationProps) {
  const [jumpToPage, setJumpToPage] = useState('')
  const [isJumping, setIsJumping] = useState(false)

  const handleJumpToPage = () => {
    const page = parseInt(jumpToPage)
    if (page >= 1 && page <= totalPages) {
      onPageChange(page - 1) // Convert to 0-based index
      setJumpToPage('')
    }
    setIsJumping(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJumpToPage()
    }
  }

  const getVisiblePages = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, currentPage + 1 - delta); i <= Math.min(totalPages - 1, currentPage + 1 + delta); i++) {
      range.push(i)
    }

    if (currentPage + 1 - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + 1 + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  const startItem = currentPage * pageSize + 1
  const endItem = Math.min((currentPage + 1) * pageSize, totalElements)

  if (totalPages <= 1) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`space-y-4 ${className}`}
    >
      {/* Pagination Info */}
      {showTotalInfo && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{startItem}</span> to{' '}
            <span className="font-medium text-foreground">{endItem}</span> of{' '}
            <span className="font-medium text-foreground">{totalElements.toLocaleString()}</span> results
          </div>
          
          {showPageSizeSelector && (
            <div className="flex items-center gap-2">
              <Label htmlFor="page-size" className="text-sm whitespace-nowrap">
                Rows per page:
              </Label>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => onPageSizeChange(parseInt(value))}
                disabled={loading}
              >
                <SelectTrigger id="page-size" className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Pagination>
          <PaginationContent>
            {/* First Page */}
            <PaginationItem>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(0)}
                disabled={currentPage === 0 || loading}
                className="gap-1"
              >
                <ChevronsLeft className="h-4 w-4" />
                <span className="hidden sm:inline">First</span>
              </Button>
            </PaginationItem>

            {/* Previous Page */}
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange(currentPage - 1)}
                className={currentPage === 0 || loading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>

            {/* Page Numbers */}
            {getVisiblePages().map((page, index) => (
              <PaginationItem key={index}>
                {page === '...' ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    onClick={() => onPageChange((page as number) - 1)}
                    isActive={currentPage === (page as number) - 1}
                    className={loading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  >
                    {page}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}

            {/* Next Page */}
            <PaginationItem>
              <PaginationNext
                onClick={() => onPageChange(currentPage + 1)}
                className={currentPage >= totalPages - 1 || loading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>

            {/* Last Page */}
            <PaginationItem>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(totalPages - 1)}
                disabled={currentPage >= totalPages - 1 || loading}
                className="gap-1"
              >
                <span className="hidden sm:inline">Last</span>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>

        {/* Jump to Page */}
        {showJumpToPage && totalPages > 5 && (
          <div className="flex items-center gap-2">
            <Label htmlFor="jump-to-page" className="text-sm whitespace-nowrap">
              Go to:
            </Label>
            <Input
              id="jump-to-page"
              type="number"
              min="1"
              max={totalPages}
              value={jumpToPage}
              onChange={(e) => setJumpToPage(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => setIsJumping(true)}
              onBlur={() => setIsJumping(false)}
              placeholder="Page"
              className="w-20"
              disabled={loading}
            />
            <Button
              size="sm"
              onClick={handleJumpToPage}
              disabled={!jumpToPage || loading}
              variant="outline"
            >
              Go
            </Button>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Loading...
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
