interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-slate-700/50">
      <button
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        className="px-3 py-1 bg-slate-700 text-slate-300 rounded text-sm hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        ← Previous
      </button>

      <div className="flex gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
              currentPage === page
                ? "bg-cyan-600 text-white border border-cyan-500"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600"
            }`}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="px-3 py-1 bg-slate-700 text-slate-300 rounded text-sm hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        Next →
      </button>
    </div>
  );
}
