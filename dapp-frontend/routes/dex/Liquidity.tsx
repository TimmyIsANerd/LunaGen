import { useRouter } from 'next/router';
import Image from 'next/image';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import assert from 'assert';
import { floor, get, map, multiply, toLower, toString } from 'lodash';
import { FaWallet } from 'react-icons/fa';
import { FiSettings, FiPlus, FiChevronDown, FiArrowLeftCircle } from 'react-icons/fi';
import { TailSpin } from 'react-loader-spinner';
import { AddressZero } from '@ethersproject/constants';
import { parseEther, parseUnits } from '@ethersproject/units';
import { abi as erc20Abi } from 'quasar-v1-core/artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';
import { abi as routerAbi } from 'quasar-v1-periphery/artifacts/contracts/QuasarRouter.sol/QuasarRouter.json';
import useSound from 'use-sound';
import UserLPItem from '../../ui/Dex/PoolsListItem';
import { useWeb3Context } from '../../contexts/web3';
import { usePairFromFactory, getLiquidityPositionsOfConnectedAccount, quote } from '../../hooks/dex';
import SwapSettingsModal from '../../ui/Dex/SwapSettingsModal';
import TokensListModal from '../../ui/Dex/TokensListModal';
import { useDEXSettingsContext } from '../../contexts/dex/settings';
import successFx from '../../assets/sounds/success_sound.mp3';
import errorFx from '../../assets/sounds/error_sound.mp3';
import TradeCard from '../../ui/Dex/Card';
import ProviderSelectModal from '../../ui/ProviderSelectModal';
import { useEtherBalance, useTokenBalance } from '../../hooks/wallet';
import routers from '../../assets/routers.json';
import { useContract } from '../../hooks/global';
import Toast from '../../ui/Toast';
import { hexValue } from '@ethersproject/bytes';
import { useImportedTokensWithListing, useTokenDetailsFromListing, useTokenImageURI } from '../../hooks/api';

enum Route {
  ADD_LIQUIDITY = 'add_liquidity',
  LIQUIDITY_POOLS = 'lps',
  FIND_OTHER_LP_TOKENS = 'find_other_lps'
}

const LPRoute = () => {
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState<boolean>(false);
  const [isProviderSelectModalVisible, setIsProviderSelectModalVisible] = useState<boolean>(false);
  const { isLoading, positions } = getLiquidityPositionsOfConnectedAccount();
  const { active } = useWeb3Context();
  const { push } = useRouter();
  return (
    <div className="flex flex-col lg:flex-row justify-center items-center w-full">
      <div className="w-full lg:w-1/3">
        <TradeCard>
          <div className="flex flex-col justify-evenly items-center w-full">
            <div className="flex justify-between w-full py-6 px-3">
              <div className="flex flex-col justify-start items-start w-8/8">
                <span className="font-Syne text-[1.8em] text-white font-[700]">Your Liquidity</span>
                <p className="font-[400] font-Poppins text-[0.9em] text-[#9d9d9d]">Remove liquidity to get tokens back</p>
              </div>
              <div className="flex justify-evenly w-1/4">
                <button onClick={() => setIsSettingsModalVisible(true)} className="bg-transparent text-[#a6b2ec] text-[1.8em]">
                  <FiSettings />
                </button>
              </div>
            </div>
            {active ? (
              <div className="px-2 py-3 flex flex-col justify-center items-center gap-3 w-full overflow-auto">
                <div className="flex justify-center items-center py-[9px] w-full overflow-auto">
                  <div className="flex justify-center items-center w-full flex-col gap-1 px-1 py-1 overflow-auto">
                    <TailSpin color="#dcdcdc" visible={isLoading} width={20} height={20} />
                    {positions.length === 0 ? (
                      <div className="flex flex-col justify-center items-center gap-2">
                        <Image src="/images/broken_piggy_bank.svg" width={200} height={200} alt="broken_piggy_bank" />
                        <span className="text-[#aaaaaa] font-Poppins font-[400] capitalize">no liquidity found</span>
                      </div>
                    ) : (
                      <div className="w-full px-2 py-2 flex flex-col justify-center items-center gap-3">
                        {map(positions, (lp, index) => (
                          <UserLPItem pair={lp} key={index} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => push(`/dex?tab=liquidity&child_tab=${Route.FIND_OTHER_LP_TOKENS}`)}
                  className="border-[#a6b2ec] border rounded-[8px] w-full py-[13px] px-[17px] text-[#a6b2ec] text-[0.89em] font-[600] flex justify-center"
                >
                  <span className="font-Syne capitalize">find other LP tokens</span>
                </button>
                <button
                  onClick={() => push(`/dex?tab=liquidity&child_tab=${Route.ADD_LIQUIDITY}`)}
                  className="flex justify-center items-center bg-[#063230] py-[13px] px-[17px] rounded-[8px] gap-2 text-[0.89em] text-white w-full"
                >
                  <FiPlus /> <span className="font-Syne capitalize">add liquidity</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center gap-10 py-10">
                <span className="text-[#fff] font-Poppins font-[400] capitalize">connect wallet to view your liquidity</span>
                <button
                  onClick={() => setIsProviderSelectModalVisible(true)}
                  className="flex justify-center items-center bg-[#063230] py-4 px-2 rounded-[8px] gap-2 text-[0.89em] text-white w-full"
                >
                  <FaWallet /> <span className="font-Syne capitalize">connect wallet</span>
                </button>
              </div>
            )}
          </div>
          <SwapSettingsModal isOpen={isSettingsModalVisible} onClose={() => setIsSettingsModalVisible(false)} />
          <ProviderSelectModal isOpen={isProviderSelectModalVisible} onClose={() => setIsProviderSelectModalVisible(false)} />
        </TradeCard>
      </div>
    </div>
  );
};

const AddLiquidityRoute = () => {
  const { back, query } = useRouter();
  const [val1, setVal1] = useState<number>(0.0);
  const [val2, setVal2] = useState<number>(0.0);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState<boolean>(false);
  const [isFirstTokensListModalVisible, setIsFirstTokensListModalVisible] = useState<boolean>(false);
  const [isSecondTokensListModalVisible, setIsSecondTokensListModalVisible] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { data: tokensListing } = useImportedTokensWithListing();
  const { active, account } = useWeb3Context();
  const { txDeadlineInMins, gasPrice, playSounds } = useDEXSettingsContext();
  const [firstSelectedToken, setFirstSelectedToken] = useState('');
  const [secondSelectedToken, setSecondSelectedToken] = useState('');

  const firstSelectedTokenDetails = useTokenDetailsFromListing(firstSelectedToken);
  const secondSelectedTokenDetails = useTokenDetailsFromListing(secondSelectedToken);

  const { balance: balance1 } =
    // eslint-disable-next-line react-hooks/rules-of-hooks
    firstSelectedToken === AddressZero ? useEtherBalance([isLoading]) : useTokenBalance(firstSelectedToken, [isLoading]);
  const { balance: balance2 } =
    // eslint-disable-next-line react-hooks/rules-of-hooks
    secondSelectedToken === AddressZero ? useEtherBalance([isLoading]) : useTokenBalance(secondSelectedToken, [isLoading]);
  const routerContract = useContract(routers, routerAbi, true);
  const firstTokenContract = useContract(firstSelectedToken, erc20Abi, true);
  const secondTokenContract = useContract(secondSelectedToken, erc20Abi, true);

  const outputAmount1 = quote(firstSelectedToken, secondSelectedToken, val1);

  const [playSuccess] = useSound(successFx);
  const [playError] = useSound(errorFx);

  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const [toastMessage, setToastMessage] = useState<string>('');

  const displayToast = useCallback((msg: string, toastType: 'success' | 'info' | 'error') => {
    setToastMessage(msg);
    setToastType(toastType);
    setShowToast(true);
  }, []);

  const addLiquidity = useCallback(async () => {
    try {
      setIsLoading(true);
      let amount1Hex = '0x0';
      let amount2Hex = '0x0';
      let liquidityTx;

      if (firstTokenContract && secondTokenContract) {
        assert.notEqual(firstTokenContract.address, secondTokenContract.address, 'identical tokens');

        const firstDecimals = await firstTokenContract.decimals();
        const secondDecimals = await secondTokenContract.decimals();

        amount1Hex = parseUnits(toString(val1), firstDecimals).toHexString();
        amount2Hex = parseUnits(toString(val2), secondDecimals).toHexString();

        const firstApprovalTx = await firstTokenContract.approve(routerContract?.address, amount1Hex);
        await firstApprovalTx.wait();
        displayToast(`Router approved to spend ${val1} ${firstSelectedTokenDetails?.symbol}`, 'info');

        const secondApprovalTx = await secondTokenContract.approve(routerContract?.address, amount2Hex);
        await secondApprovalTx.wait();
        displayToast(`Router approved to spend ${val2} ${secondSelectedTokenDetails?.symbol}`, 'info');

        const currentTime = floor(Date.now() / 1000);

        const gas = await routerContract?.estimateGas.addLiquidity(
          firstTokenContract.address,
          secondTokenContract.address,
          amount1Hex,
          amount2Hex,
          amount1Hex,
          amount2Hex,
          account,
          hexValue(currentTime + multiply(txDeadlineInMins, 60)),
          { gasPrice: parseUnits(toString(gasPrice), 'gwei').toHexString() }
        );
        liquidityTx = await routerContract?.addLiquidity(
          firstTokenContract.address,
          secondTokenContract.address,
          amount1Hex,
          amount2Hex,
          amount1Hex,
          amount2Hex,
          account,
          hexValue(currentTime + multiply(txDeadlineInMins, 60)),
          { gasPrice: parseUnits(toString(gasPrice), 'gwei').toHexString(), gasLimit: gas?.toHexString() }
        );
      } else {
        const paths = firstTokenContract === null ? [AddressZero, secondTokenContract?.address] : [AddressZero, firstTokenContract.address];
        let amount1 = '0x0';
        let amount2 = '0x0';

        if (firstTokenContract) {
          const decimals = await firstTokenContract.decimals();
          amount1 = parseUnits(toString(val1), decimals).toHexString();
        } else {
          amount1 = parseEther(toString(val1)).toHexString();
        }

        if (secondTokenContract) {
          const decimals = await secondTokenContract.decimals();
          amount2 = parseUnits(toString(val2), decimals).toHexString();
        } else {
          amount2 = parseEther(toString(val2)).toHexString();
        }
        const currentTime = floor(Date.now() / 1000);

        const gas = await routerContract?.estimateGas.addLiquidityETH(
          paths[1],
          amount2,
          amount2,
          amount1,
          account,
          hexValue(currentTime + multiply(txDeadlineInMins, 60)),
          { value: amount1, gasPrice: parseUnits(toString(gasPrice), 'gwei').toHexString() }
        );
        liquidityTx = await routerContract?.addLiquidityETH(
          paths[1],
          amount2,
          amount2,
          amount1,
          account,
          hexValue(currentTime + multiply(txDeadlineInMins, 60)),
          { value: amount1, gasLimit: gas?.toHexString(), gasPrice: parseUnits(toString(gasPrice), 'gwei').toHexString() }
        );
      }

      await liquidityTx.wait();
      setIsLoading(false);
      displayToast('liquidity created successfully', 'success');

      if (playSounds) playSuccess();
    } catch (error: any) {
      setIsLoading(false);
      if (playSounds) playError();
      displayToast('an error occurred', 'error');
    }
  }, [
    account,
    displayToast,
    firstSelectedTokenDetails?.symbol,
    firstTokenContract,
    gasPrice,
    playError,
    playSounds,
    playSuccess,
    routerContract,
    secondSelectedTokenDetails?.symbol,
    secondTokenContract,
    txDeadlineInMins,
    val1,
    val2
  ]);

  useEffect(() => {
    if (outputAmount1 > 0) setVal2(outputAmount1);
  }, [outputAmount1]);

  // useEffect(() => {
  //   if (outputAmount2 > 0) setVal1(outputAmount2);
  // }, [outputAmount2]);

  useEffect(() => {
    if (tokensListing.length > 1) {
      setFirstSelectedToken(
        query.inputToken && map(tokensListing, (token) => toLower(token.address)).includes(toLower(query.inputToken as string))
          ? (query.inputToken as string)
          : get(tokensListing[0], 'address')
      );
    }
  }, [query.inputToken, tokensListing]);

  useEffect(() => {
    if (tokensListing.length > 1) {
      setSecondSelectedToken(
        query.outputToken && map(tokensListing, (token) => toLower(token.address)).includes(toLower(query.outputToken as string))
          ? (query.outputToken as string)
          : get(tokensListing[1], 'address')
      );
    }
  }, [query.outputToken, tokensListing]);

  return (
    <>
      <div className="flex justify-center w-full items-center flex-col lg:flex-row">
        <div className="w-full lg:w-1/3">
          <TradeCard>
            <div className="flex flex-col justify-evenly items-center w-full h-full">
              <div className="flex justify-between w-full py-6 px-3">
                <button onClick={() => back()} className="bg-transparent text-[#a6b2ec] text-[30px]">
                  <FiArrowLeftCircle />
                </button>
                <div className="flex flex-col justify-center items-start">
                  <span className="font-Syne text-[1.8em] text-white font-[700] capitalize">add liquidity</span>
                  <p className="font-[400] font-Poppins text-[0.9em] text-[#9d9d9d] capitalize">receive LP tokens</p>
                </div>
                <div className="flex justify-center items-center gap-2">
                  <button onClick={() => setIsSettingsModalVisible(true)} className="bg-transparent text-[#a6b2ec] text-[30px]">
                    <FiSettings />
                  </button>
                </div>
              </div>
              <div className="flex flex-col justify-center w-full gap-2 px-[9px]">
                <div className="flex flex-col w-full px-2 py-2 justify-evenly gap-2">
                  <div className="flex justify-between w-full font-Syne">
                    <span className="text-white">From</span>
                    <span className="text-[#c8bfbf]"> Balance: {balance1}</span>
                  </div>
                  <div className="flex justify-between w-full gap-1 items-center rounded-[8px] bg-[#fff]/[.07]">
                    <div
                      className="flex justify-evenly items-center p-4 cursor-pointer gap-2 w-auto"
                      onClick={() => setIsFirstTokensListModalVisible(true)}
                    >
                      <div className="avatar">
                        <div className="w-8 rounded-full">
                          <img src={useTokenImageURI(firstSelectedToken)} alt={firstSelectedTokenDetails?.name} />
                        </div>
                      </div>
                      <span className="text-white uppercase font-[700] text-[1em] font-Syne">{firstSelectedTokenDetails?.symbol}</span>
                      <FiChevronDown className="text-white" />
                    </div>

                    <input
                      type="number"
                      value={val1}
                      className="p-3 bg-transparent text-white w-1/2 border-0 outline-0 appearance-none font-[600] text-[1em] font-Poppins text-right"
                      onChange={(e) => setVal1(e.target.valueAsNumber || 0.0)}
                    />
                  </div>
                  <div className="flex justify-end items-center w-full gap-1">
                    <button
                      onClick={() => setVal1(multiply(1 / 4, balance1))}
                      className="border border-[#3f84ea] rounded-[8px] px-2 py-1 font-Syne text-[#3f84ea] capitalize font-[400] text-[0.75em]"
                    >
                      25%
                    </button>
                    <button
                      onClick={() => setVal1(multiply(2 / 4, balance1))}
                      className="border border-[#3f84ea] rounded-[8px] px-2 py-1 font-Syne text-[#3f84ea] capitalize font-[400] text-[0.75em]"
                    >
                      50%
                    </button>
                    <button
                      onClick={() => setVal1(multiply(3 / 4, balance1))}
                      className="border border-[#3f84ea] rounded-[8px] px-2 py-1 font-Syne text-[#3f84ea] capitalize font-[400] text-[0.75em]"
                    >
                      75%
                    </button>
                    <button
                      onClick={() => setVal1(balance1)}
                      className="border border-[#3f84ea] rounded-[8px] px-2 py-1 font-Syne text-[#3f84ea] capitalize font-[400] text-[0.75em]"
                    >
                      100%
                    </button>
                  </div>
                </div>
                <div className="flex justify-center items-center">
                  <button className="bg-transparent text-[#a6b2ec] text-[1em] rounded-full border border-[#a6b2ec]">
                    <FiPlus />
                  </button>
                </div>
                <div className="flex flex-col w-full px-2 py-2 justify-evenly gap-2">
                  <div className="flex justify-between w-full font-Syne">
                    <span className="text-white">To</span>
                    <span className="text-[#c8bfbf]"> Balance: {balance2}</span>
                  </div>
                  <div className="flex justify-between w-full gap-1 items-center rounded-[8px] bg-[#fff]/[.07]">
                    <div
                      className="flex justify-evenly items-center p-4 cursor-pointer gap-2 w-auto"
                      onClick={() => setIsSecondTokensListModalVisible(true)}
                    >
                      <div className="avatar">
                        <div className="w-8 rounded-full">
                          <img src={useTokenImageURI(secondSelectedToken)} alt={secondSelectedTokenDetails?.name} />
                        </div>
                      </div>
                      <span className="text-white uppercase font-[700] text-[1em] font-Syne">{secondSelectedTokenDetails?.symbol}</span>
                      <FiChevronDown className="text-white" />
                    </div>

                    <input
                      type="number"
                      value={val2}
                      className="p-3 bg-transparent text-white w-1/2 border-0 outline-0 appearance-none font-[600] text-[1em] font-Poppins text-right"
                      onChange={(e) => setVal2(e.target.valueAsNumber || 0.0)}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-center items-center w-full px-2 py-8">
                <button
                  onClick={addLiquidity}
                  disabled={isLoading || !active}
                  className="flex justify-center items-center bg-[#063230] py-4 px-3 text-[0.95em] text-white w-full rounded-[8px] gap-3"
                >
                  <span className="font-Syne">
                    {!active
                      ? 'Wallet not connected'
                      : val1 > balance1
                        ? `Insufficient ${firstSelectedTokenDetails?.symbol} balance`
                        : 'Add Liquidity'}
                  </span>
                  <TailSpin color="#dcdcdc" visible={isLoading} width={20} height={20} />
                </button>
              </div>
            </div>
          </TradeCard>
        </div>
        <Toast message={toastMessage} toastType={toastType} duration={10} onHide={() => setShowToast(false)} show={showToast} />
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
};

const FindOtherLPRoute = () => {
  const { data: tokensListing } = useImportedTokensWithListing();
  const [firstSelectedToken, setFirstSelectedToken] = useState(useMemo(() => get(tokensListing[0], 'address'), [tokensListing]));
  const [secondSelectedToken, setSecondSelectedToken] = useState(useMemo(() => get(tokensListing[1], 'address'), [tokensListing]));
  const firstSelectedTokenDetails = useTokenDetailsFromListing(firstSelectedToken);
  const secondSelectedTokenDetails = useTokenDetailsFromListing(secondSelectedToken);
  const [isImportLoading, setIsImportLoading] = useState<boolean>(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState<boolean>(false);
  const [isFirstTokensListModalVisible, setIsFirstTokensListModalVisible] = useState<boolean>(false);
  const [isSecondTokensListModalVisible, setIsSecondTokensListModalVisible] = useState<boolean>(false);
  const { back } = useRouter();
  const pair = usePairFromFactory(firstSelectedToken, secondSelectedToken);
  const { positions } = getLiquidityPositionsOfConnectedAccount();

  // const addToPools = useCallback(() => {
  //   setIsImportLoading(true);
  //   importPool(pair);
  //   setIsImportLoading(false);
  // }, [pair]);

  useEffect(() => {
    if (tokensListing.length > 1) {
      setFirstSelectedToken(get(tokensListing[0], 'address'));
    }
  }, [tokensListing]);

  useEffect(() => {
    if (tokensListing.length > 1) {
      setSecondSelectedToken(get(tokensListing[1], 'address'));
    }
  }, [tokensListing]);

  return (
    <div className="flex justify-center w-full items-center flex-col lg:flex-row">
      <div className="w-full lg:w-1/3">
        <TradeCard>
          <div className="flex flex-col justify-evenly items-center w-full gap-5">
            <div className="flex justify-between w-full py-6 px-3">
              <button onClick={() => back()} className="bg-transparent text-[#a6b2ec] text-[30px]">
                <FiArrowLeftCircle />
              </button>
              <div className="flex flex-col justify-center items-start">
                <span className="font-Syne text-[1.8em] text-white font-[700] capitalize">import pool</span>
                <p className="font-[400] font-Poppins text-[0.9em] text-[#9d9d9d] capitalize">import an existing LP token</p>
              </div>
              <div className="flex justify-center items-center gap-2">
                <button onClick={() => setIsSettingsModalVisible(true)} className="bg-transparent text-[#a6b2ec] text-[30px]">
                  <FiSettings />
                </button>
              </div>
            </div>
            <div className="flex flex-col justify-center items-center gap-7 w-full px-4 font-Syne text-white">
              <button
                onClick={() => setIsFirstTokensListModalVisible(true)}
                className="bg-[#fff]/[.07] w-full rounded-[8px] flex justify-between items-center px-5 py-7"
              >
                <div className="flex justify-between items-center gap-2">
                  <div className="avatar">
                    <div className="w-6 rounded-full">
                      <img src={useTokenImageURI(firstSelectedToken)} alt={firstSelectedTokenDetails?.symbol} />
                    </div>
                  </div>
                  <span>{firstSelectedTokenDetails?.symbol}</span>
                </div>
                <FiChevronDown />
              </button>
              <button className="bg-transparent text-[#a6b2ec] text-[1em] rounded-full border border-[#a6b2ec]">
                <FiPlus />
              </button>
              <button
                onClick={() => setIsSecondTokensListModalVisible(true)}
                className="bg-[#fff]/[.07] w-full rounded-[8px] flex justify-between items-center px-5 py-7"
              >
                <div className="flex justify-between items-center gap-2">
                  <div className="avatar">
                    <div className="w-6 rounded-full">
                      <img src={useTokenImageURI(secondSelectedToken)} alt={secondSelectedTokenDetails?.symbol} />
                    </div>
                  </div>
                  <span>{secondSelectedTokenDetails?.symbol}</span>
                </div>
                <FiChevronDown />
              </button>
              <div className="flex w-full justify-center items-center px-2 py-3">
                {pair === AddressZero ? (
                  <span className="text-[red]/50 font-Poppins capitalize">invalid pair</span>
                ) : (
                  <button
                    disabled={isImportLoading || map(positions, (lp) => lp.pair.id).includes(pair)}
                    onClick={() => { }}
                    className="flex justify-center items-center bg-[#063230] py-4 px-3 text-[0.95em] text-white w-full rounded-[8px] gap-3"
                  >
                    <span className="font-Syne capitalize">import</span>
                    <TailSpin color="#dcdcdc" visible={isImportLoading} width={20} height={20} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </TradeCard>
      </div>
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
  );
};

const useLiqiditySubRoutes = (routes: Route) => {
  const [component, setComponent] = useState(() => LPRoute);

  useEffect(() => {
    switch (routes) {
      case Route.ADD_LIQUIDITY:
        setComponent(() => AddLiquidityRoute);
        break;
      case Route.FIND_OTHER_LP_TOKENS:
        setComponent(() => FindOtherLPRoute);
        break;
      case Route.LIQUIDITY_POOLS:
        setComponent(() => LPRoute);
        break;
      default:
        setComponent(() => LPRoute);
        break;
    }
  }, [routes]);
  return component;
};

export default function Liquidity() {
  const { query } = useRouter();
  const RenderedChild = useLiqiditySubRoutes(query.child_tab as Route);
  return (
    <div className="w-full overflow-auto flex justify-center items-center">
      <RenderedChild />
    </div>
  );
}
