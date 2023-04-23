import React, { MouseEvent } from 'react';

type IToggleButtonProps = {
  isActive: boolean;
  onClick: (event?: MouseEvent) => any;
  children: any;
};

export default function SquareToggleButton({ isActive, onClick, children }: IToggleButtonProps) {
  return (
    <button
      className={`${
        isActive ? 'bg-[#E6E6E6] rounded-[6px] text-[#063230]' : 'bg-transparent text-[#cdcccc]'
      } py-2 px-3 flex justify-center text-[0.5em] lg:text-[0.85em] font-Syne font-[400]`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
