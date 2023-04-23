import { map } from 'lodash';
import { useMemo } from 'react';
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi';

type IPaginationProps = {
  currentPage: number;
  dataLength: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
};

export default function Pagination({ currentPage, dataLength, itemsPerPage = 10, onPageChange }: IPaginationProps) {
  const pageNumbers = useMemo(() => {
    let pages: number[] = [];

    for (let i = 1; i <= Math.ceil(dataLength / itemsPerPage); i++) pages.push(i);
    return pages;
  }, [itemsPerPage, dataLength]);

  const maxPageNumberLimit = useMemo(() => currentPage + 5, [currentPage]);
  const lowerPageNumberLimit = useMemo(() => (currentPage >= 5 ? currentPage - 5 : 1), [currentPage]);

  return (
    <div className="flex justify-between items-center w-full font-Inter text-[0.5em] lg:text-[0.82em] gap-1">
      <button
        className="bg-[#E6E6E6] text-[#063230] flex justify-center items-center gap-1 px-3 py-2 rounded-[8px]"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <FiArrowLeft /> Previous
      </button>
      <div className="flex justify-center items-center gap-1">
        {map(pageNumbers, (num, index) => (
          <div key={index} className={`${num <= maxPageNumberLimit && num >= lowerPageNumberLimit ? 'block' : 'hidden'}`}>
            {num <= maxPageNumberLimit && num >= lowerPageNumberLimit && (
              <button
                className={`${num === currentPage ? 'bg-[#E6E6E6]' : 'bg-transparent'} rounded-[8px] px-2 py-1 text-[#063230]`}
                disabled={currentPage === num}
                onClick={() => onPageChange(num)}
              >
                {num}
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        className="bg-[#E6E6E6] text-[#063230] flex justify-center items-center gap-1 px-3 py-2 rounded-[8px]"
        disabled={currentPage === Math.ceil(dataLength / itemsPerPage)}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next <FiArrowRight />
      </button>
    </div>
  );
}
