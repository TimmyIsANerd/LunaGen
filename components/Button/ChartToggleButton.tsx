import React, { MouseEvent } from 'react';

type IToggleButtonProps = {
  isActive: boolean;
  onClick: (event?: MouseEvent) => any;
  children: any;
};

export default function ChartToggleButton({ isActive, onClick, children }: IToggleButtonProps) {
  return (
    <button
      className={`${
        isActive ? 'font-[700]' : 'font-[400]'
      } px-[6px] bg-transparent py-[19px] md:py-[6px] md:px-[19px] text-[#ffffff] flex flex-col md:flex-row justify-center text-[14px] font-Montserrat`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
