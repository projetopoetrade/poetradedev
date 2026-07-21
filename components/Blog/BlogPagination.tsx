"use client"

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Suspense } from "react"

interface BlogPaginationProps {
  currentPage: number
  totalPages: number
  locale: string
  onPageChange?: (page: number) => void
}

// Suspense por causa do `useSearchParams` em rota pré-renderizada.
export default function BlogPagination(props: BlogPaginationProps) {
  return (
    <Suspense fallback={null}>
      <BlogPaginationInner {...props} />
    </Suspense>
  )
}

function BlogPaginationInner({ currentPage, totalPages, locale, onPageChange }: BlogPaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createPageURL = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', pageNumber.toString())
    return `${pathname}?${params.toString()}`
  }

  // Com `onPageChange`, a troca de pagina acontece em memoria (a listagem toda
  // ja veio no payload) e nao dispara navegacao ao servidor. Os href continuam
  // reais para acessibilidade e clique com o botao do meio.
  const handlePageChange = (pageNumber: number) => {
    window.scrollTo({ top: 0, behavior: 'smooth' })

    if (onPageChange) {
      onPageChange(pageNumber)
      return
    }

    router.push(createPageURL(pageNumber))
  }

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const showEllipsisThreshold = 7

    if (totalPages <= showEllipsisThreshold) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      if (currentPage > 3) {
        pages.push('ellipsis-start')
      }

      // Show pages around current page
      const startPage = Math.max(2, currentPage - 1)
      const endPage = Math.min(totalPages - 1, currentPage + 1)

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis-end')
      }

      // Always show last page
      pages.push(totalPages)
    }

    return pages
  }

  if (totalPages <= 1) {
    console.log('Pagination hidden: totalPages <= 1', { totalPages })
    return null
  }

  return (
    <Pagination className="my-8 border-t border-border pt-8">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={currentPage > 1 ? createPageURL(currentPage - 1) : '#'}
            onClick={(e) => {
              if (currentPage <= 1) {
                e.preventDefault()
              } else {
                e.preventDefault()
                handlePageChange(currentPage - 1)
              }
            }}
            className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
          />
        </PaginationItem>

        {getPageNumbers().map((page, index) => {
          if (typeof page === 'string') {
            return (
              <PaginationItem key={`${page}-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            )
          }

          return (
            <PaginationItem key={page}>
              <PaginationLink
                href={createPageURL(page)}
                onClick={(e) => {
                  e.preventDefault()
                  handlePageChange(page)
                }}
                isActive={currentPage === page}
                className="cursor-pointer"
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          )
        })}

        <PaginationItem>
          <PaginationNext
            href={currentPage < totalPages ? createPageURL(currentPage + 1) : '#'}
            onClick={(e) => {
              if (currentPage >= totalPages) {
                e.preventDefault()
              } else {
                e.preventDefault()
                handlePageChange(currentPage + 1)
              }
            }}
            className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

