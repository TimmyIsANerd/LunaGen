import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useState } from 'react';
import { FiSettings, FiChevronDown } from 'react-icons/fi';
import { IoMdRefreshCircle } from 'react-icons/io';
import { MdOutlineSwapHoriz, MdArrowDownward } from 'react-icons/md';
import { ToastContainer, toast } from 'react-toastify';
import { AddressZero } from '@ethersproject/constants';
import { Contract } from '@ethersproject/contracts';
import { Web3Provider } from '@ethersproject/providers';
import { parseUnits } from '@ethersproject/units';
import _ from 'lodash';
import assert from 'assert';
import { WETH, Fetcher, Trade, TokenAmount, Router, Percent, ETHER, CurrencyAmount } from 'quasar-sdk-core';
import JSBI from 'jsbi';
import { abi as erc20Abi } from 'quasar-v1-core/artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';
import { abi as routerAbi } from 'quasar-v1-periphery/artifacts/contracts/QuasarRouter02.sol/QuasarRouter02.json';
import useSound from 'use-sound';
import SwapSettingsModal from '../../components/Dex/SwapSettingsModal';
import TokensListModal from '../../components/Dex/TokensListModal';
import { ListingModel } from '../../api/models/dex';
import { useAPIContext } from '../../contexts/api';
import { useWeb3Context } from '../../contexts/web3';
import { computePair, getToken1Price, fetchTokenBalanceForConnectedWallet, getInputAmount, getOutputAmount } from '../../hooks/dex';
import routers from '../../assets/routers.json';
import chains from '../../assets/chains.json';
import { useDEXSettingsContext } from '../../contexts/dex/settings';
import successFx from '../../assets/sounds/success_sound.mp3';
import errorFx from '../../assets/sounds/error_sound.mp3';

enum ChartPeriod {
  DAY,
  WEEK,
  MONTH,
  YEAR
}

export default function Swap() {
  const { reload } = useRouter();
  const [val1, setVal1] = useState<number>(0.0);
  const [val2, setVal2] = useState<number>(0.0);
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>(ChartPeriod.DAY);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState<boolean>(false);
  const [isFirstTokensListModalVisible, setIsFirstTokensListModalVisible] = useState<boolean>(false);
  const [isSecondTokensListModalVisible, setIsSecondTokensListModalVisible] = useState<boolean>(false);
  const [isSwapLoading, setIsSwapLoading] = useState<boolean>(false);

  const { tokensListing } = useAPIContext();
  const { chainId, active, library, account } = useWeb3Context();
  const { txDeadlineInMins, slippageTolerance, gasPrice, playSounds } = useDEXSettingsContext();
  const [firstSelectedToken, setFirstSelectedToken] = useState<ListingModel>({} as ListingModel);
  const [secondSelectedToken, setSecondSelectedToken] = useState<ListingModel>({} as ListingModel);

  const { pair, error: pairError } = computePair(firstSelectedToken, secondSelectedToken, chainId || 97);
  const token1Price = getToken1Price(firstSelectedToken, secondSelectedToken, chainId || 97);

  const balance1 = fetchTokenBalanceForConnectedWallet(firstSelectedToken.address, [isSwapLoading]);
  const balance2 = fetchTokenBalanceForConnectedWallet(secondSelectedToken.address, [isSwapLoading]);

  const outputAmount = getOutputAmount(firstSelectedToken, secondSelectedToken, val1, chainId || 1);
  const inputAmount = getInputAmount(firstSelectedToken, secondSelectedToken, val2, chainId || 1);

  const [playSuccess] = useSound(successFx);
  const [playError] = useSound(errorFx);

  const switchSelectedTokens = useCallback(() => {
    const token1 = firstSelectedToken;
    const token2 = secondSelectedToken;

    setFirstSelectedToken(token2);
    setSecondSelectedToken(token1);
  }, [firstSelectedToken, secondSelectedToken]);

  const swapTokens = useCallback(async () => {
    try {
      setIsSwapLoading(true);
      const firstIsZero = firstSelectedToken.address === AddressZero;
      const secondIsZero = secondSelectedToken.address === AddressZero;
      const t0 = firstIsZero ? WETH[(chainId as keyof typeof WETH) || 97] : await Fetcher.fetchTokenData(chainId || 97, firstSelectedToken.address);
      const t1 = secondIsZero ? WETH[(chainId as keyof typeof WETH) || 97] : await Fetcher.fetchTokenData(chainId || 97, secondSelectedToken.address);
      const router = routers[chainId as unknown as keyof typeof routers];

      assert.notDeepEqual(t0, t1, 'Identical tokens');

      const value0 = parseUnits(val1.toString(), t0.decimals).toHexString();
      // const value1 = parseUnits(val2.toString(), t1.decimals).toHexString();

      const provider = new Web3Provider(library?.givenProvider);
      const token0Contract = new Contract(t0.address, erc20Abi, provider.getSigner());
      const routerContract = new Contract(router, routerAbi, provider.getSigner());

      if (!firstIsZero) {
        const approvalTx = await token0Contract.approve(router, value0);
        await approvalTx.wait();
        toast(`Router approved to spend ${val1} ${t0.symbol}`, { type: 'info' });
      }

      let swapTx: any;

      const pair = await Fetcher.fetchPairData(t0, t1);
      const trades = Trade.bestTradeExactIn(
        [pair],
        _.isEqual(firstSelectedToken.address, AddressZero) ? CurrencyAmount.ether(value0) : new TokenAmount(t0, value0),
        _.isEqual(secondSelectedToken.address, AddressZero) ? ETHER : t1
      );
      const { args, methodName, value } = Router.swapCallParameters(trades[0], {
        ttl: _.multiply(txDeadlineInMins, 60),
        allowedSlippage: new Percent(`0x${JSBI.BigInt(slippageTolerance * 100).toString(16)}`, `0x${JSBI.BigInt(100).toString(16)}`),
        recipient: account as string,
        feeOnTransfer: chainId !== 97
      });

      switch (methodName) {
        case 'swapExactETHForTokensSupportingFeeOnTransferTokens': {
          const gas = await routerContract.estimateGas.swapExactETHForTokensSupportingFeeOnTransferTokens(args[0], args[1], args[2], args[3], {
            value,
            gasPrice: parseUnits(gasPrice.toString(), 'gwei').toHexString()
          });
          swapTx = await routerContract.swapExactETHForTokensSupportingFeeOnTransferTokens(args[0], args[1], args[2], args[3], {
            value,
            gasPrice: parseUnits(gasPrice.toString(), 'gwei').toHexString(),
            gasLimit: gas.toHexString()
          });
          break;
        }
        case 'swapExactETHForTokens': {
          const gas = await routerContract.estimateGas.swapExactETHForTokens(args[0], args[1], args[2], args[3], {
            value,
            gasPrice: parseUnits(gasPrice.toString(), 'gwei').toHexString()
          });
          swapTx = await routerContract.swapExactETHForTokens(args[0], args[1], args[2], args[3], {
            value,
            gasPrice: parseUnits(gasPrice.toString(), 'gwei').toHexString(),
            gasLimit: gas.toHexString()
          });
          break;
        }
        case 'swapExactTokensForETHSupportingFeeOnTransferTokens': {
          const gas = await routerContract.estimateGas.swapExactTokensForETHSupportingFeeOnTransferTokens(
            args[0],
            args[1],
            args[2],
            args[3],
            args[4],
            {
              value,
              gasPrice: parseUnits(gasPrice.toString(), 'gwei').toHexString()
            }
          );
          swapTx = await routerContract.swapExactTokensForETHSupportingFeeOnTransferTokens(args[0], args[1], args[2], args[3], args[4], {
            value,
            gasPrice: parseUnits(gasPrice.toString(), 'gwei').toHexString(),
            gasLimit: gas.toHexString()
          });
          break;
        }
        case 'swapExactTokensForETH': {
          const gas = await routerContract.estimateGas.swapExactTokensForETH(args[0], args[1], args[2], args[3], args[4], {
            value,
            gasPrice: parseUnits(gasPrice.toString(), 'gwei').toHexString()
          });
          swapTx = await routerContract.swapExactTokensForETH(args[0], args[1], args[2], args[3], args[4], {
            value,
            gasPrice: parseUnits(gasPrice.toString(), 'gwei').toHexString(),
            gasLimit: gas.toHexString()
          });
          break;
        }
        case 'swapExactTokensForTokensSupportingFeeOnTransferTokens': {
          const gas = await routerContract.estimateGas.swapExactTokensForTokensSupportingFeeOnTransferTokens(
            args[0],
            args[1],
            args[2],
            args[3],
            args[4],
            {
              value,
              gasPrice: parseUnits(gasPrice.toString(), 'gwei').toHexString()
            }
          );
          swapTx = await routerContract.swapExactTokensForTokensSupportingFeeOnTransferTokens(args[0], args[1], args[2], args[3], args[4], {
            value,
            gasPrice: parseUnits(gasPrice.toString(), 'gwei').toHexString(),
            gasLimit: gas.toHexString()
          });
          break;
        }
        case 'swapExactTokensForTokens': {
          const gas = await routerContract.estimateGas.swapExactTokensForTokens(args[0], args[1], args[2], args[3], args[4], {
            value,
            gasPrice: parseUnits(gasPrice.toString(), 'gwei').toHexString()
          });
          swapTx = await routerContract.swapExactTokensForTokens(args[0], args[1], args[2], args[3], args[4], {
            value,
            gasPrice: parseUnits(gasPrice.toString(), 'gwei').toHexString(),
            gasLimit: gas.toHexString()
          });
          break;
        }
      }
      swapTx = await swapTx.wait();

      setIsSwapLoading(false);
      if (playSounds) playSuccess();

      const explorerUrl = chains[chainId as unknown as keyof typeof chains].explorer;
      toast(
        <div className="flex justify-center gap-2 text-[16px] font-poppins items-center">
          <span className="text-white">Trade successful!</span>
          <a href={explorerUrl.concat(`/tx/${swapTx.transactionHash}`)} target="_blank" rel="noreferrer">
            View on explorer
          </a>
        </div>,
        { type: 'success' }
      );
    } catch (error: any) {
      console.log(error);
      setIsSwapLoading(false);
      if (playSounds) playError();
      toast(error.message, { type: 'error' });
    }
  }, [
    account,
    chainId,
    firstSelectedToken.address,
    gasPrice,
    library?.givenProvider,
    playError,
    playSounds,
    playSuccess,
    secondSelectedToken.address,
    slippageTolerance,
    txDeadlineInMins,
    val1
  ]);

  useEffect(() => {
    if (tokensListing.length >= 2) {
      setFirstSelectedToken(tokensListing[0]);
      setSecondSelectedToken(tokensListing[1]);
    }
  }, [tokensListing]);

  useEffect(() => {
    setVal2(outputAmount);
  }, [outputAmount]);

  // useEffect(() => {
  //   setVal1(inputAmount);
  // }, [inputAmount]);

  return (
    <>
      <div className="flex justify-center w-full items-center">
        <div className="bg-[#000]/[.75] rounded-[15px] shadow-lg flex justify-center items-center w-full md:w-1/3 md:max-h-[600px] font-Montserrat">
          <div className="flex flex-col justify-evenly items-center w-full h-full">
            <div className="flex justify-between w-full bg-[#161525] rounded-t-[15px] py-6 px-3">
              <span className="font-MontserratAlt text-[20px] text-white font-[600]">Swap</span>
              <div className="flex justify-center gap-3 items-center">
                <button onClick={reload} className="bg-transparent text-white text-[30px] cursor-pointer">
                  <IoMdRefreshCircle />
                </button>
                <button onClick={() => setIsSettingsModalVisible(true)} className="bg-transparent text-white text-[30px]">
                  <FiSettings />
                </button>
              </div>
            </div>
            <div className="flex flex-col justify-center w-full mt-10 gap-2 px-[9px]">
              <div className="bg-[#161525]/[.75] rounded-[12px] flex flex-col w-full px-[23px] py-[9px] justify-evenly gap-2">
                <div className="flex justify-between w-full">
                  <span className="text-white">From</span>
                  <span className="text-white"> Balance: {balance1}</span>
                </div>
                <div className="flex justify-between w-full gap-1">
                  <div className="flex justify-between items-center gap-1">
                    <div
                      className="flex justify-start items-center border-r border-white p-4 cursor-pointer gap-1 w-[150px]"
                      onClick={() => setIsFirstTokensListModalVisible(true)}
                    >
                      <img src={firstSelectedToken.logoURI} alt={firstSelectedToken.name} className="rounded-[50px] w-[30px] h-[30px]" />
                      <span className="text-white uppercase font-[700] text-[16px]">{firstSelectedToken.symbol}</span>
                      <FiChevronDown className="text-white" />
                    </div>
                    <div className="flex justify-center items-center gap-1 flex-1">
                      <button
                        onClick={() => setVal1(parseFloat(balance1))}
                        className="p-[2px] bg-[#2775ca] opacity-[.19] text-[#c6c3c3] text-[10px] font-[600]"
                      >
                        Max
                      </button>
                      <button
                        onClick={() => setVal1(_.multiply(0.5, parseFloat(balance1)))}
                        className="p-[2px] bg-[#2775ca] opacity-[.19] text-[#c6c3c3] text-[10px] font-[600]"
                      >
                        Half
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end w-[200px]">
                    <input
                      type="number"
                      className="p-[12px] bg-transparent text-white border-0 w-full outline-0 appearance-none font-[600] text-[18px]"
                      value={val1}
                      onChange={(e) => setVal1(e.target.valueAsNumber || 0.0)}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-center items-center">
                <button onClick={switchSelectedTokens} className="bg-transparent text-[#ffffff] text-[23px] rounded-full border border-[#fff]/75">
                  <MdArrowDownward />
                </button>
              </div>
              <div className="bg-[#161525]/[.75] rounded-[12px] flex flex-col w-full px-[23px] py-[9px] justify-evenly gap-2">
                <div className="flex justify-between w-full">
                  <span className="text-white">To</span>
                  <span className="text-white"> Balance: {balance2}</span>
                </div>
                <div className="flex justify-between w-full gap-1">
                  <div className="flex justify-center items-center gap-1">
                    <div
                      onClick={() => setIsSecondTokensListModalVisible(true)}
                      className="flex justify-start items-center border-r border-white p-4 cursor-pointer gap-1 w-[150px]"
                    >
                      <img src={secondSelectedToken.logoURI} alt={secondSelectedToken.name} className="rounded-[50px] w-[30px] h-[30px]" />
                      <span className="text-white uppercase font-[700] text-[16px]">{secondSelectedToken.symbol}</span>
                      <FiChevronDown className="text-white" />
                    </div>
                    <div className="flex justify-center items-center flex-1 gap-1">
                      <button
                        onClick={() => setVal2(parseFloat(balance2))}
                        className="p-[2px] bg-[#2775ca] opacity-[.19] text-[#c6c3c3] text-[10px] font-[600]"
                      >
                        Max
                      </button>
                      <button
                        onClick={() => setVal2(_.multiply(0.5, parseFloat(balance2)))}
                        className="p-[2px] bg-[#2775ca] opacity-[.19] text-[#c6c3c3] text-[10px] font-[600]"
                      >
                        Half
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end w-[200px]">
                    <input
                      type="number"
                      className="p-[12px] bg-transparent text-white border-0 w-full outline-0 appearance-none font-[600] text-[18px]"
                      value={val2}
                      onChange={(e) => setVal2(e.target.valueAsNumber || 0.0)}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-center w-full items-center my-2 px-2 py-2">
              {!pairError ? (
                <div className="flex justify-center w-full items-center flex-col gap-2 px-3 py-2">
                  <div className="flex justify-between w-full items-center font-poppins gap-3">
                    <span className="text-white font-[300]">1 {secondSelectedToken.symbol}</span>
                    <MdOutlineSwapHoriz className="text-white font-[400] text-[30px]" />
                    <span className="text-white font-[300]">
                      {token1Price} {firstSelectedToken.symbol}
                    </span>
                  </div>
                  <div className="flex justify-between w-full items-center font-poppins gap-3">
                    <span className="text-white font-[300]">
                      You pay in {inputAmount} {firstSelectedToken.symbol}
                    </span>
                    {/* <MdOutlineSwapHoriz className="text-white font-[400] text-[30px]" /> */}
                    <span className="text-white font-[300]">
                      You get {outputAmount} {secondSelectedToken.symbol}
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-red-400 font-Montserrat text-[15px]">{pairError.message}</span>
              )}
            </div>
            <div className="flex justify-center gap-2 items-center w-full flex-col px-2 py-4">
              <button
                onClick={swapTokens}
                disabled={!!pairError || isSwapLoading || val1 <= 0 || val1 > parseFloat(balance1) || !active}
                className={`flex justify-center items-center bg-[#1673b9]/50 btn py-[20px] px-[10px] text-[18px] text-white w-full ${
                  isSwapLoading ? 'loading' : ''
                }`}
              >
                <span className="font-MontserratAlt">
                  {!active ? 'Wallet not connected' : val1 > parseFloat(balance1) ? `Insufficient ${firstSelectedToken.symbol} balance` : 'Swap'}
                </span>
              </button>
            </div>
          </div>
        </div>
        <ToastContainer position="top-right" theme="dark" autoClose={5000} />
        <SwapSettingsModal isOpen={isSettingsModalVisible} onClose={() => setIsSettingsModalVisible(false)} />
        <TokensListModal
          isVisible={isFirstTokensListModalVisible}
          onClose={() => setIsFirstTokensListModalVisible(false)}
          onTokenSelected={(token) => setFirstSelectedToken(token)}
          selectedTokens={[firstSelectedToken, secondSelectedToken]}
        />
        <TokensListModal
          isVisible={isSecondTokensListModalVisible}
          onClose={() => setIsSecondTokensListModalVisible(false)}
          onTokenSelected={(token) => setSecondSelectedToken(token)}
          selectedTokens={[firstSelectedToken, secondSelectedToken]}
        />
      </div>
    </>
  );
}
