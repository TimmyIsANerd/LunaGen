import { Transition, Dialog } from '@headlessui/react';
import React, { Fragment, useCallback, useState } from 'react';
import { FiX } from 'react-icons/fi';
import { ToastContainer } from 'react-toastify';

type IUnstakeModalProps = {
  pool: string;
  isOpen: boolean;
  onClose: () => void;
  amountStaked: string;
};

export default function UnstakeModal({ pool, isOpen, onClose, amountStaked }: IUnstakeModalProps) {
  const [amount, setAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const unstakeAmount = useCallback(async () => {
    try {
    } catch (error: any) {}
  }, []);
  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={onClose}>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="fixed inset-0 bg-[#000]/[.95]" aria-hidden="true" />
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <div className="container  top-0 bottom-0 left-0 right-0 w-[500px] mx-auto overflow-hidden  bg-[#161525]/[.7] mix-blend-normal rounded-[15px] backdrop-blur-[64px] text-white">
                  <div className="bg-[#161525]/[.5] p-[30px]">
                    <div className="flex flex-row items-center justify-between">
                      <h2 className="text-2xl font-semibold">Unstake tokens</h2>
                      <button onClick={onClose} className="text-[#000] text-[30] p-[8px] flex justify-center rounded-[100%] bg-[#fff] font-[700]">
                        <FiX />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-center items-center w-full px-4 flex-col gap-3 py-2 font-Montserrat">
                    <input
                      type="number"
                      className="p-[12px] bg-transparent text-white border-b border-b-white/70 w-full outline-0 appearance-none font-[600] text-[18px]"
                      value={amount}
                      onChange={(e) => setAmount(e.target.valueAsNumber || 0)}
                    />
                    <div className="flex justify-center items-center gap-2">
                      <button disabled={amount <= 0} className="btn btn-accent">
                        Unstake Amount
                      </button>
                      <button className="btn btn-warning">Unstake All</button>
                    </div>
                  </div>
                </div>
              </Transition.Child>
              <ToastContainer position="top-right" theme="dark" autoClose={5000} />
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
