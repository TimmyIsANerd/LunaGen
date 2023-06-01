import React, { Fragment } from 'react';
import { FiX } from 'react-icons/fi';
import { Dialog, Transition } from '@headlessui/react';
import { useWeb3Context } from '../../contexts/web3';
import chains from '../../assets/chains.json';
import { map } from 'lodash';
import { hexValue } from '@ethersproject/bytes';

type ChainSwitchModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ChainSwitchModal({ isOpen = false, onClose }: ChainSwitchModalProps) {
  const { switchChain } = useWeb3Context();
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
                <div className="container  top-0 bottom-0 left-0 right-0 w-[400px] mx-auto overflow-hidden  bg-[#1a1a1a] mix-blend-normal rounded-[20px] backdrop-blur-[64px] text-white">
                  <div className="bg-transparent p-[30px]">
                    <div className="flex flex-row items-center justify-between">
                      <h2 className="text-2xl font-[700] font-Syne capitalize">switch chain</h2>
                      <button
                        onClick={onClose}
                        className="text-[#eaebec]/[.49] text-[0.67em] border border-[#eaebec]/[.49] p-1 flex justify-center rounded-full font-[700]"
                      >
                        <FiX />
                      </button>
                    </div>
                  </div>
                  <ul tabIndex={0} className="menu p-2 bg-transparent w-full text-white font-Syne overflow-auto">
                    {map(Object.keys(chains), (key: keyof typeof chains, index:number) => (
                      <li key={index}>
                        <a className="gap-2 text-[1em]" onClick={() => switchChain(hexValue(parseInt(key)))}>
                          <div className="avatar">
                            <div className="w-8 rounded-full">
                              <img src={chains[key].logoURI} alt={chains[key].symbol} />
                            </div>
                          </div>
                          {chains[key].name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
