import { Transition, Dialog } from '@headlessui/react';
import _ from 'lodash';
import React, { Fragment, useCallback, useMemo, useState } from 'react';
import { FiArrowDownCircle, FiX } from 'react-icons/fi';
import { ToastContainer, toast } from 'react-toastify';
import { Fetcher, WETH } from 'quasar-sdk-core';
import { Contract } from '@ethersproject/contracts';
import { Web3Provider } from '@ethersproject/providers';
import { parseEther, parseUnits } from '@ethersproject/units';
import { abi as routerAbi } from 'quasar-v1-periphery/artifacts/contracts/QuasarRouter02.sol/QuasarRouter02.json';
import { abi as erc20Abi } from 'quasar-v1-core/artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';
import useSound from 'use-sound';
import { fetchLiquidityValue } from '../../../hooks/dex';
import { useWeb3Context } from '../../../contexts/web3';
import { useAPIContext } from '../../../contexts/api';
import { useDEXSettingsContext } from '../../../contexts/dex/settings';
import errorFx from '../../../assets/sounds/error_sound.mp3';
import successFx from '../../../assets/sounds/success_sound.mp3';
import chains from '../../../assets/chains.json';
import routers from '../../../assets/routers.json';

type IRemoveLiquidityModalProps = {
  isVisible: boolean;
  onClose: () => void;
  token1Symbol: string;
  token2Symbol: string;
  pair: string;
  token1Address: string;
  token2Address: string;
  liquidity: number;
};

export default function RemoveLiquidityModal({
  isVisible,
  onClose,
  token1Symbol,
  token2Symbol,
  liquidity,
  pair,
  token1Address,
  token2Address
}: IRemoveLiquidityModalProps) {
  const [value, setValue] = useState<number>(0);
  const { chainId, library, account } = useWeb3Context();
  const { tokensListingAsDictionary } = useAPIContext();
  const { playSounds, txDeadlineInMins } = useDEXSettingsContext();
  const token1LiquidityValue = fetchLiquidityValue(pair, chainId as number, token1Address, _.multiply(value, liquidity) / 100);
  const token2LiquidityValue = fetchLiquidityValue(pair, chainId as number, token2Address, _.multiply(value, liquidity) / 100);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [playSuccess] = useSound(successFx);
  const [playError] = useSound(errorFx);

  const chain = useMemo(() => chains[chainId as unknown as keyof typeof chains], [chainId]);
  const router = useMemo(() => routers[chainId as unknown as keyof typeof routers], [chainId]);

  const removeLiquidity = useCallback(async () => {
    try {
      setIsLoading(true);
      const weth = WETH[chainId as unknown as keyof typeof WETH];
      const token0 = await Fetcher.fetchTokenData(chainId || 97, token1Address, chain.rpcUrl);
      const token1 = await Fetcher.fetchTokenData(chainId || 97, token2Address, chain.rpcUrl);
      const firstIsWETH = weth.address.toLowerCase() === token0.address.toLowerCase();
      const secondIsWETH = weth.address.toLowerCase() === token1.address.toLowerCase();
      const provider = new Web3Provider(library?.givenProvider);
      const routerContract = new Contract(router, routerAbi, provider.getSigner());
      const pairContract = new Contract(pair, erc20Abi, provider.getSigner());

      const approveTx = await pairContract.approve(router, parseUnits((_.multiply(value, liquidity) / 100).toFixed(6)).toHexString());

      await approveTx.wait();
      toast('Router approved to withdraw liquidity', { type: 'info' });

      let removeLiquidityTx;
      const deadline = `0x${(Math.floor(Date.now() / 1000) + txDeadlineInMins * 60).toString(16)}`;

      if (firstIsWETH || secondIsWETH) {
        const whichIsntWETH = !firstIsWETH ? token0 : token1;
        const [tokenAmount, ethAmount] = firstIsWETH
          ? [parseUnits(token2LiquidityValue.toFixed(6), token1.decimals).toHexString(), parseEther(token1LiquidityValue.toFixed(6)).toHexString()]
          : [parseUnits(token1LiquidityValue.toFixed(6), token0.decimals).toHexString(), parseEther(token2LiquidityValue.toFixed(6)).toHexString()];
        removeLiquidityTx = await routerContract.removeLiquidityETHSupportingFeeOnTransferTokens(
          whichIsntWETH.address,
          parseUnits((_.multiply(value, liquidity) / 100).toFixed(6)).toHexString(),
          tokenAmount,
          ethAmount,
          account,
          deadline
        );
      } else {
        removeLiquidityTx = await routerContract.removeLiquidity(
          token0.address,
          token1.address,
          parseUnits((_.multiply(value, liquidity) / 100).toFixed(6)).toHexString(),
          parseUnits(token1LiquidityValue.toFixed(6), token0.decimals).toHexString(),
          parseUnits(token2LiquidityValue.toFixed(6), token1.decimals).toHexString(),
          account,
          deadline
        );
      }

      removeLiquidityTx = await removeLiquidityTx.wait();
      setIsLoading(false);

      if (playSounds) playSuccess();

      toast(
        <div className="flex justify-center gap-2 text-[16px] font-poppins items-center">
          <span className="text-white">Liquidity withdrawn successfully!</span>
          <a href={chain.explorer.concat(`/tx/${removeLiquidityTx.transactionHash}`)} target="_blank" rel="noreferrer">
            View on explorer
          </a>
        </div>,
        { type: 'success' }
      );
    } catch (error: any) {
      setIsLoading(false);

      if (playSounds) playError();

      toast(error.message, { type: 'error' });
    }
  }, [
    account,
    chain.explorer,
    chain.rpcUrl,
    chainId,
    library?.givenProvider,
    liquidity,
    pair,
    playError,
    playSounds,
    playSuccess,
    router,
    token1Address,
    token1LiquidityValue,
    token2Address,
    token2LiquidityValue,
    txDeadlineInMins,
    value
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
              <div className="container top-0 bottom-0 left-0 right-0 w-[400px] mx-auto bg-[#161525]/[.7] mix-blend-normal rounded-[10px] backdrop-blur-[64px] text-white">
                <div className="bg-[#161525]/[.5] p-[30px]">
                  <div className="flex flex-row">
                    <div className="flex flex-row items-center justify-between w-full">
                      <h2 className="text-2xl font-semibold">
                        Remove {token1Symbol}-{token2Symbol} Liquidity
                      </h2>
                      <button onClick={onClose} className="text-[#000] text-[30] p-[8px] flex justify-center rounded-[100%] bg-[#fff] font-[700]">
                        <FiX />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-center items-center gap-1 px-3 py-3">
                  <div className="flex flex-col justify-start items-start gap-2 px-4 py-3">
                    <span className="text-[#c7c7c7] font-Montserrat font-[600] text-[13px]">Amount</span>
                    <div className="bg-[#161525] border border-[#353434]/[.17] w-full px-2 py-2">
                      <div className="flex flex-col gap-2 justify-start items-start">
                        <span className="text-[#fff] font-Montserrat font-[700] text-[27px]">{value}%</span>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={value}
                          onChange={(e) => setValue(e.target.valueAsNumber)}
                          className="w-full bg-[#1673b9]"
                        />
                        <div className="flex justify-evenly items-center gap-2 w-full font-Montserrat">
                          <button onClick={() => setValue(25)} className="bg-[#1673b9]/10 rounded-[10px] px-5 py-2">
                            25%
                          </button>
                          <button onClick={() => setValue(50)} className="bg-[#1673b9]/10 rounded-[10px] px-5 py-2">
                            50%
                          </button>
                          <button onClick={() => setValue(75)} className="bg-[#1673b9]/10 rounded-[10px] px-5 py-2">
                            75%
                          </button>
                          <button onClick={() => setValue(100)} className="bg-[#1673b9]/10 rounded-[10px] px-5 py-2">
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
                    <span className="text-[#ffeb82] font-Montserrat font-[600] text-[13px]">You will receive</span>
                    <div className="flex flex-col justify-center items-center gap-7 w-full px-2 py-4 border border-[#353434]/[.17] bg-[#000] rounded-[10px]">
                      <div className="flex justify-between gap-2 items-center w-full">
                        <div className="flex justify-center items-center gap-1">
                          <div className="avatar">
                            <div className="w-10 rounded-xl">
                              <img
                                src={
                                  tokensListingAsDictionary[token1Address.toLowerCase()]
                                    ? tokensListingAsDictionary[token1Address.toLowerCase()].logoURI
                                    : '/images/placeholder_image.svg'
                                }
                                alt={token1Symbol}
                              />
                            </div>
                          </div>
                          <span className="font-Montserrat text-white text-[20px] text-[600]">{token1Symbol}</span>
                        </div>
                        <span className="font-Montserrat text-white text-[20px]">{token1LiquidityValue}</span>
                      </div>
                      <div className="flex justify-between gap-2 items-center w-full">
                        <div className="flex justify-center items-center gap-1">
                          <div className="avatar">
                            <div className="w-10 rounded-xl">
                              <img
                                src={
                                  tokensListingAsDictionary[token2Address.toLowerCase()]
                                    ? tokensListingAsDictionary[token2Address.toLowerCase()].logoURI
                                    : '/images/placeholder_image.svg'
                                }
                                alt={token2Symbol}
                              />
                            </div>
                          </div>
                          <span className="font-Montserrat text-white text-[20px] text-[600]">{token2Symbol}</span>
                        </div>
                        <span className="font-Montserrat text-white text-[20px]">{token2LiquidityValue}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    disabled={value === 0 || token1LiquidityValue === 0 || token2LiquidityValue === 0 || isLoading}
                    onClick={removeLiquidity}
                    className={`btn bg-[#1673b9]/50 w-full font-Montserrat ${isLoading ? 'btn-loading' : ''}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </Transition.Child>
            <ToastContainer position="top-right" theme="dark" autoClose={5000} />
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
