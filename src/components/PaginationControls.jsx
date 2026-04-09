import { memo, useCallback } from "react";

const PaginationControls = memo(function PaginationControls({
  currentPage,
  totalPages,
  itemsPerPage,
  setCurrentPage,
  setItemsPerPage,
}) {
  const handlePrevious = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, [setCurrentPage]);

  const handleNext = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, [setCurrentPage, totalPages]);

  const handlePerPageChange = useCallback((e) => {
    setItemsPerPage(Number(e.target.value));
  }, [setItemsPerPage]);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4 p-4 bg-white rounded-xl shadow-md border border-gray-100">
      <div className="flex items-center gap-3">
        <span className="text-gray-600 font-medium text-sm">Éléments par page :</span>
        <select
          value={itemsPerPage}
          onChange={handlePerPageChange}
          className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] transition-all text-sm bg-white"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-[#1E3A8A] text-white rounded-lg hover:bg-[#3B82F6] transition-all text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm"
        >
          Précédent
        </button>
        <span className="text-gray-700 font-medium text-sm min-w-[120px] text-center">
          Page {currentPage} sur {totalPages}
        </span>
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-[#1E3A8A] text-white rounded-lg hover:bg-[#3B82F6] transition-all text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm"
        >
          Suivant
        </button>
      </div>
    </div>
  );
});

export default PaginationControls;