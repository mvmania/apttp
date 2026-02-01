import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const pages = [];
    // Logic to show limited page numbers (e.g., 1, 2, ..., 10)
    // For simplicity, showing max 5 pages window centered on current
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }

    return (
        <div className="flex items-center justify-center space-x-2 mt-12 mb-8">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>

            {startPage > 1 && (
                <>
                    <button
                        onClick={() => onPageChange(1)}
                        className={`w-10 h-10 rounded-xl font-bold transition-all ${currentPage === 1
                                ? 'bg-apctt-blue text-white shadow-lg shadow-apctt-blue/30'
                                : 'text-slate-600 hover:bg-slate-50 border border-slate-200'
                            }`}
                    >
                        1
                    </button>
                    {startPage > 2 && <span className="text-slate-400">...</span>}
                </>
            )}

            {pages.map(page => (
                <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`w-10 h-10 rounded-xl font-bold transition-all ${currentPage === page
                            ? 'bg-apctt-blue text-white shadow-lg shadow-apctt-blue/30'
                            : 'text-slate-600 hover:bg-slate-50 border border-slate-200'
                        }`}
                >
                    {page}
                </button>
            ))}

            {endPage < totalPages && (
                <>
                    {endPage < totalPages - 1 && <span className="text-slate-400">...</span>}
                    <button
                        onClick={() => onPageChange(totalPages)}
                        className={`w-10 h-10 rounded-xl font-bold transition-all ${currentPage === totalPages
                                ? 'bg-apctt-blue text-white shadow-lg shadow-apctt-blue/30'
                                : 'text-slate-600 hover:bg-slate-50 border border-slate-200'
                            }`}
                    >
                        {totalPages}
                    </button>
                </>
            )}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
        </div>
    );
};
