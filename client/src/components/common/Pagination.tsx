import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
    if (totalPages <= 5) return i + 1;
    if (currentPage <= 3) return i + 1;
    if (currentPage >= totalPages - 2) return totalPages - 4 + i;
    return currentPage - 2 + i;
  });

  return (
    <div className="flex items-center gap-1">
      <button
        className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-border text-sm text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        disabled={currentPage === 1}
        onClick={() => onPageChange?.(currentPage - 1)}
        data-testid="pagination-prev"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {pages.map(page => (
        <button
          key={page}
          className={`inline-flex items-center justify-center w-8 h-8 rounded-md text-sm font-medium transition-colors ${
            page === currentPage
              ? "bg-primary text-primary-foreground"
              : "border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
          onClick={() => onPageChange?.(page)}
          data-testid={`pagination-page-${page}`}
        >
          {page}
        </button>
      ))}
      <button
        className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-border text-sm text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange?.(currentPage + 1)}
        data-testid="pagination-next"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
