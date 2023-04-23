import { Transition, Dialog } from '@headlessui/react';
import { floor, multiply, toLower, toString } from 'lodash';
import React, { Fragment, useCallback, useMemo, useState } from 'react';
import { FiArrowDownCircle, FiX } from 'react-icons/fi';
import { abi as routerAbi } from 'quasar-v1-periphery/artifacts/contracts/QuasarRouter02.sol/QuasarRouter02.json';
import { abi as erc20Abi } from 'quasar-v1-core/artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';
import useSound from 'use-sound';
import { useLiquidityValue, useSinglePair } from '../../../hooks/dex';
import { useDEXSettingsContext } from '../../../contexts/dex/settings';
import errorFx from '../../../assets/sounds/error_sound.mp3';
import successFx from '../../../assets/sounds/success_sound.mp3';
import routers from '../../../assets/routers.json';
import { useContract } from '../../../hooks/global';
import { useTokenBalance } from '../../../hooks/wallet';
import { parseEther, parseUnits } from '@ethersproject/units';
import Toast from '../../Toast';
import { hexValue } from '@ethersproject/bytes';
import { useWeb3Context } from '../../../contexts/web3';
import { WETH } from 'quasar-sdk-core';
import { TailSpin } from 'react-loader-spinner';
import { useListingAsDictionary } from '../../../hooks/api';

type IRemoveLiquidityModalProps = {
  isVisible: boolean;
  onClose: () => void;
  pair: string;
};

export default function RemoveLiquidityModal({ isVisible, onClose, pair }: IRemoveLiquidityModalProps) {
  const tokensListingAsDictionary = useListingAsDictionary();
  const { playSounds, txDeadlineInMins } = useDEXSettingsContext();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [playSuccess] = useSound(successFx);
  const [playError] = useSound(errorFx);
  const [value, setValue] = useState(0);

  const { data: pairData } = useSinglePair(pair);
  const { balance } = useTokenBalance(pair, [isLoading]);
  const { chainId, account } = useWeb3Context();
  const wrappedEther = useMemo(() => WETH[chainId as keyof typeof WETH], [chainId]);

  const router = useContract(routers, routerAbi, true);
  const pairContract = useContract(pair, erc20Abi, true);
  const token0LiquidityValue = useLiquidityValue(pair, pairData?.token0.id, multiply(balance, value) / 100);
  const token1LiquidityValue = useLiquidityValue(pair, pairData?.token1.id, multiply(balance, value) / 100);
  const token0Contract = useContract(pairData?.token0.id, erc20Abi);
  const token1Contract = useContract(pairData?.token1.id, erc20Abi);

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'info' | 'error'>('info');
  const [showToast, setShowToast] = useState(false);

  const displayToast = useCallback((msg: string, toastType: 'success' | 'info' | 'error') => {
    setToastMessage(msg);
    setToastType(toastType);
    setShowToast(true);
  }, []);

  const removeLiquidity = useCallback(async () => {
    try {
      setIsLoading(true);
      const amountToRemove = parseUnits(toString(multiply(value, balance) / 100)).toHexString();
      const approveTx = await pairContract?.approve(router?.address, amountToRemove);
      await approveTx.wait();
      displayToast('router approved to withdraw liquidity', 'info');

      let removeLiquidityTx;

      const deadline = hexValue(floor(Date.now() / 1000) + multiply(txDeadlineInMins, 60));
      const oneIsWETH =
        toLower(token0Contract?.address) === toLower(wrappedEther.address) || toLower(token1Contract?.address) === toLower(wrappedEther.address);

      if (oneIsWETH) {
        const whichIsntWETH = toLower(token0Contract?.address) !== toLower(wrappedEther.address) ? token0Contract?.address : token1Contract?.address;
        const token0Decimals = await token0Contract?.decimals();
        const token1Decimals = await token1Contract?.decimals();

        const [tokenAmount, ethAmount] =
          toLower(token0Contract?.address) === toLower(wrappedEther.address)
            ? [parseUnits(toString(token1LiquidityValue), token1Decimals).toHexString(), parseEther(toString(token0LiquidityValue)).toHexString()]
            : [parseUnits(toString(token0LiquidityValue), token0Decimals).toHexString(), parseEther(toString(token1LiquidityValue)).toHexString()];
        removeLiquidityTx = await router?.removeLiquidityETHSupportingFeeOnTransferTokens(
          whichIsntWETH,
          parseUnits(toString(multiply(value, balance) / 100)).toHexString(),
          tokenAmount,
          ethAmount,
          account,
          deadline
        );
      } else {
        const token0Decimals = await token0Contract?.decimals();
        const token1Decimals = await token1Contract?.decimals();

        removeLiquidityTx = await router?.removeLiquidity(
          token0Contract?.address,
          token1Contract?.address,
          parseUnits(toString(multiply(value, balance) / 100)).toHexString(),
          parseUnits(toString(token0LiquidityValue), token0Decimals).toHexString(),
          parseUnits(toString(token1LiquidityValue), token1Decimals).toHexString(),
          account,
          deadline
        );
      }
      await removeLiquidityTx.wait();
      setIsLoading(false);
      if (playSounds) playSuccess();
      displayToast('successfully removed liquidity', 'success');
    } catch (error: any) {
      setIsLoading(false);
      if (playSounds) playError();
      displayToast('failed to remove liquidity', 'error');
    }
  }, [
    account,
    balance,
    displayToast,
    pairContract,
    playError,
    playSounds,
    playSuccess,
    router,
    token0Contract,
    token0LiquidityValue,
    token1Contract,
    token1LiquidityValue,
    txDeadlineInMins,
    value,
    wrappedEther.address
  ]);
  return (
    <Transition appear show={isVisible}>
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
              <div className="container top-0 bottom-0 left-0 right-0 max-w-[446px] mx-auto overflow-hidden bg-[#1a1a1a] px-2 rounded-[20px] flex flex-col justify-start items-center mix-blend-normal backdrop-blur-[64px] text-white">
                <div className="bg-transparent px-4 py-4 w-full border-b border-[#5d5d5d]">
                  <div className="flex flex-row items-center justify-between w-full">
                    <h2 className="text-sm lg:text-2xl font-[700] font-Syne capitalize">
                      remove {pairData?.token0.symbol}-{pairData?.token1.symbol} liquidity
                    </h2>
                    <button
                      onClick={onClose}
                      className="text-[#eaebec]/[.49] text-[0.67em] border border-[#eaebec]/[.49] p-1 flex justify-center rounded-full font-[700]"
                    >
                      <FiX />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col justify-center items-center gap-1 px-3 py-3 w-full">
                  <div className="flex flex-col justify-start items-start gap-2 px-4 py-3 w-full">
                    <div className="w-full flex justify-between items-center">
                      <span className="text-[#c7c7c7] font-Syne font-[600] text-[0.7em] lg:text-[1em] capitalize">amount</span>
                      <span className="text-[#aaa] font-Montserrat font-Syne font-[700] text-[0.7em] lg:text-[1em]">{value}%</span>
                    </div>
                    <div className="bg-[#fff]/[.07] rounded-[8px] w-full px-2 py-2">
                      <div className="flex flex-col gap-2 justify-start items-start">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={value}
                          onChange={(e) => setValue(e.target.valueAsNumber)}
                          className="w-full range range-primary"
                        />
                        <div className="flex justify-start items-center gap-2 w-full">
                          <button
                            onClick={() => setValue(25)}
                            className="border border-[#3f84ea] rounded-[8px] px-2 py-1 font-Syne text-[#3f84ea] capitalize font-[400] text-[0.58em] lg:text-[0.78em]"
                          >
                            25%
                          </button>
                          <button
                            onClick={() => setValue(50)}
                            className="border border-[#3f84ea] rounded-[8px] px-2 py-1 font-Syne text-[#3f84ea] capitalize font-[400] text-[0.58em] lg:text-[0.78em]"
                          >
                            50%
                          </button>
                          <button
                            onClick={() => setValue(75)}
                            className="border border-[#3f84ea] rounded-[8px] px-2 py-1 font-Syne text-[#3f84ea] capitalize font-[400] text-[0.58em] lg:text-[0.78em]"
                          >
                            75%
                          </button>
                          <button
                            onClick={() => setValue(100)}
                            className="border border-[#3f84ea] rounded-[8px] px-2 py-1 font-Syne text-[#3f84ea] capitalize font-[400] text-[0.58em] lg:text-[0.78em]"
                          >
                            100%
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center items-center w-full px-1 py-3">
                    <FiArrowDownCircle className="text-white text-[20px]" />
                  </div>
                  <div className="flex flex-col justify-start items-start gap-2 w-full px-3 py-3">
                    <span className="text-[#a6b2ec] font-Syne font-[600] text-[0.8em] lg:text-[0.82em] capitalize">you will receive</span>
                    <div className="flex flex-col justify-center items-center gap-7 w-full px-2 py-4">
                      <div className="flex justify-between gap-2 items-center w-full">
                        <div className="flex justify-center items-center gap-1">
                          <div className="avatar">
                            <div className="w-10 rounded-xl">
                              <img
                                src={tokensListingAsDictionary[pairData?.token0.id]?.logoURI ?? '/images/placeholder_image.svg'}
                                alt={pairData?.token0.symbol}
                              />
                            </div>
                          </div>
                          <span className="font-Syne text-white text-[20px] text-[600]">{pairData?.token0.symbol}</span>
                        </div>
                        <span className="font-Poppins text-[#a6b2ec] text-[20px]">{token0LiquidityValue}</span>
                      </div>
                      <div className="flex justify-between gap-2 items-center w-full">
                        <div className="flex justify-center items-center gap-1">
                          <div className="avatar">
                            <div className="w-10 rounded-xl">
                              <img
                                src={tokensListingAsDictionary[pairData?.token1.id]?.logoURI ?? '/images/placeholder_image.svg'}
                                alt={pairData?.token1.symbol}
                              />
                            </div>
                          </div>
                          <span className="font-Syne text-white text-[20px] text-[600]">{pairData?.token1.symbol}</span>
                        </div>
                        <span className="font-Poppins text-[#a6b2ec] text-[20px]">{token1LiquidityValue}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    disabled={value === 0 || token0LiquidityValue === 0 || token1LiquidityValue === 0 || isLoading}
                    onClick={removeLiquidity}
                    className="flex justify-center items-center bg-[#063230] py-4 px-3 text-[0.95em] text-white w-full rounded-[8px] gap-3 font-Syne capitalize"
                  >
                    remove <TailSpin color="#dcdcdc" visible={isLoading} width={20} height={20} />
                  </button>
                </div>
              </div>
            </Transition.Child>
            <Toast message={toastMessage} toastType={toastType} duration={10} onHide={() => setShowToast(false)} show={showToast} />
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
