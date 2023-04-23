import React, { Fragment } from 'react';
import { FaQuestionCircle } from 'react-icons/fa';
import { FiX } from 'react-icons/fi';
import { Switch, Dialog, Transition } from '@headlessui/react';
import { useDEXSettingsContext } from '../../../contexts/dex/settings';

type SwapSettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function SwapSettingsModal({ isOpen = false, onClose }: SwapSettingsModalProps) {
  const {
    gasPrice,
    changeGasPrice,
    slippageTolerance,
    changeSlippage,
    txDeadlineInMins,
    changeTXDeadline,
    // isExpertMode,
    // switchExpertMode,
    // isLightningMode,
    // switchLightningMode,
    playSounds,
    switchSoundsMode
  } = useDEXSettingsContext();
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
                    <div className="flex flex-row items-center justify-between border-b border-[#eaebec]/[.49] py-1">
                      <h2 className="text-2xl font-[700] font-Syne">Settings</h2>
                      <button
                        onClick={onClose}
                        className="text-[#eaebec]/[.49] text-[0.67em] border border-[#eaebec]/[.49] p-1 flex justify-center rounded-full font-[700]"
                      >
                        <FiX />
                      </button>
                    </div>
                  </div>
                  <div className="px-5 py-5 flex flex-col gap-2 font-Syne justify-center">
                    <div className="flex flex-col justify-center items-start gap-1">
                      <h2 className="text-[#a6b2ec] capitalize text-2l font-semibold">Swaps &amp; Liquidity</h2>
                      <div className="flex flex-row items-center w-full justify-start py-2 text-sm text-slate-300 gap-1">
                        <span className="font-[700] font-Syne">Default Transaction Speed (GWEI)</span>
                        <div className="tooltip tooltip-bottom" data-tip="How fast do you want this transaction?">
                          <FaQuestionCircle className="text-[1em] text-[#105dcf]" />
                        </div>
                      </div>
                      <div className="flex flex-row flex-wrap items-center justify-start gap-1 w-full ">
                        <button
                          type="button"
                          className={`h-7 mr-1 rounded-[10px] border border-[#555555] p-2 flex items-center justify-center outline-0 text-[0.87em] ${gasPrice === 100 ? 'bg-[#a6b2ec] text-[#373b4f]' : 'bg-[#333333] text-[#a6b2ec]'
                            } hover:bg-[#a6b2ec]`}
                          onClick={() => changeGasPrice(100)}
                        >
                          Standard (100)
                        </button>

                        <button
                          type="button"
                          className={`h-7 mr-1 rounded-[10px] border border-[#555555] p-2 flex items-center justify-center outline-0 text-[0.87em] ${gasPrice === 150 ? 'bg-[#a6b2ec] text-[#373b4f]' : 'bg-[#333333] text-[#a6b2ec]'
                            } hover:bg-[#a6b2ec]`}
                          onClick={() => changeGasPrice(150)}
                        >
                          Fast (150)
                        </button>
                        <button
                          type="button"
                          className={`h-7 mr-1 rounded-[10px] border border-[#555555] p-2 flex items-center justify-center outline-0 text-[0.87em] ${gasPrice === 250 ? 'bg-[#a6b2ec] text-[#373b4f]' : 'bg-[#333333] text-[#a6b2ec]'
                            } hover:bg-[#a6b2ec]`}
                          onClick={() => changeGasPrice(250)}
                        >
                          Super-Fast (250)
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col justify-center items-start gap-2">
                      <div className="flex flex-row items-center w-full justify-start text-sm gap-1 py-1">
                        <span className="capitalize text-2l font-semibold">Slippage Tolerance</span>
                        <div className="tooltip tooltip-bottom" data-tip="How much price change you're willing to permit during transaction.">
                          <FaQuestionCircle className="text-[1em] text-[#105dcf]" />
                        </div>
                      </div>
                      <div className="flex flex-row flex-wrap items-center justify-start gap-1 w-full ">
                        <button
                          type="button"
                          onClick={() => changeSlippage(0.1)}
                          className={`w-1/5 rounded-[10px] p-1 border border-[#555555] flex items-center justify-center text-[0.87em] outline-0 ${slippageTolerance === 0.1 ? 'bg-[#a6b2ec] text-[#373b4f]' : 'bg-[#333333] text-[#a6b2ec]'
                            } hover:bg-[#a6b2ec]`}
                        >
                          0.1%
                        </button>
                        <button
                          type="button"
                          onClick={() => changeSlippage(0.5)}
                          className={`w-1/5 rounded-[10px] p-1 border border-[#555555] flex items-center justify-center outline-0 text-[0.87em] ${slippageTolerance === 0.5 ? 'bg-[#a6b2ec] text-[#373b4f]' : 'bg-[#333333] text-[#a6b2ec]'
                            } hover:bg-[#a6b2ec]`}
                        >
                          0.5%
                        </button>
                        <button
                          type="button"
                          onClick={() => changeSlippage(1)}
                          className={`w-1/5 rounded-[10px] p-1 border border-[#555555] flex items-center justify-center outline-0 text-[0.87em] ${slippageTolerance === 1 ? 'bg-[#a6b2ec] text-[#373b4f]' : 'bg-[#333333] text-[#a6b2ec]'
                            } hover:bg-[#a6b2ec]`}
                        >
                          1.0%
                        </button>
                        <input
                          type="number"
                          onChange={(e) => changeSlippage(e.target.valueAsNumber || 0.1)}
                          className="w-1/5 rounded-[10px] py-1 px-2 border border-[#555555] flex items-center justify-center outline-0 text-[#a6b2ec] bg-[#333333] text-[0.87em]"
                          placeholder="0.1%"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center w-full gap-2">
                      <div className="w-full flex items-start justify-center flex-col gap-2">
                        <div className="flex flex-row items-center w-full justify-start text-sm gap-1 py-1">
                          <span className="capitalize text-2l font-semibold">Tx Deadline (mins)</span>
                          <div
                            className="tooltip tooltip-bottom"
                            data-tip="How long to wait after execution before a transaction is considered failed."
                          >
                            <FaQuestionCircle className="text-[1em] text-[#105dcf]" />
                          </div>
                        </div>
                        <input
                          type="number"
                          value={txDeadlineInMins}
                          onChange={(e) => changeTXDeadline(e.target.valueAsNumber || 5)}
                          className="w-1/5 rounded-[10px] py-1 px-2 border border-[#555555] flex items-center justify-center outline-0 text-[#a6b2ec] bg-[#333333] text-[0.87em]"
                          placeholder="5"
                        />
                      </div>
                      {/* <div className="w-full flex items-center justify-between my-2">
                        <div className="mr-1 flex items-center flex-[1] text-sm text-slate-300">
                          Lightning Mode (Beta)
                          <FaQuestionCircle className="ml-1 text-[10px]" />
                        </div>
                        <div className="flex-[0.2]">
                          <Switch
                            checked={isLightningMode}
                            onClick={switchLightningMode}
                            className={`${isLightningMode ? 'bg-[#4F4F4F]' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full`}
                          >
                            <span className="sr-only">Enable notifications</span>
                            <span
                              className={`${
                                isLightningMode ? 'translate-x-6 bg-black' : 'translate-x-1 bg-white'
                              } inline-block h-4 w-4 transform rounded-full transition`}
                            />
                          </Switch>
                        </div>
                      </div>
                      <div className="w-full flex items-center justify-between my-2">
                        <div className="mr-1 flex items-center flex-[1] text-sm text-slate-300">
                          Expert Mode
                          <FaQuestionCircle className="ml-1 text-[10px]" />
                        </div>
                        <div className="flex-[0.2]">
                          <Switch
                            checked={isExpertMode}
                            onClick={switchExpertMode}
                            className={`${isExpertMode ? 'bg-[#4F4F4F]' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full`}
                          >
                            <span className="sr-only">Enable notifications</span>
                            <span
                              className={`${
                                isExpertMode ? 'translate-x-6 bg-black' : 'translate-x-1 bg-white'
                              } inline-block h-4 w-4 transform rounded-full transition`}
                            />
                          </Switch>
                        </div>
                      </div> */}
                      <div className="w-full flex items-start flex-col gap-2 justify-center">
                        <div className="flex flex-row items-center w-full justify-start text-sm gap-1 py-1">
                          <span className="capitalize text-2l font-semibold">Play Sounds</span>
                          <div className="tooltip tooltip-bottom" data-tip="Sound FX for distinct transaction states.">
                            <FaQuestionCircle className="text-[1em] text-[#105dcf]" />
                          </div>
                        </div>

                        <Switch
                          checked={playSounds}
                          onClick={switchSoundsMode}
                          className={`${playSounds ? 'bg-[#063230]' : 'bg-[#333333]'} flex h-6 w-11 items-center rounded-full`}
                        >
                          <span className="sr-only">Enable notifications</span>
                          <span
                            className={`${playSounds ? 'translate-x-6 bg-[#fff]' : 'translate-x-1 bg-[#000]'
                              } inline-block h-4 w-4 transform rounded-full transition`}
                          />
                        </Switch>
                      </div>
                    </div>
                  </div>
                </div>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
