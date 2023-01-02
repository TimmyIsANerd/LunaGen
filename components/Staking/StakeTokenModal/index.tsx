import { Interface } from '@ethersproject/abi';
import { AddressZero } from '@ethersproject/constants';
import { Contract } from '@ethersproject/contracts';
import { Web3Provider } from '@ethersproject/providers';
import { Transition, Dialog } from '@headlessui/react';
import _ from 'lodash';
import { Fetcher, Token } from 'quasar-sdk-core';
import { ToastContainer, toast } from 'react-toastify';
import { abi as erc20Abi } from 'vefi-token-launchpad-staking/artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';
import { abi as stakingPoolAbi } from 'vefi-token-launchpad-staking/artifacts/contracts/StakingPool.sol/StakingPool.json';
import { abi as specialPoolAbi } from 'vefi-token-launchpad-staking/artifacts/contracts/SpecialStakingPool.sol/SpecialStakingPool.json';
import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { FiX } from 'react-icons/fi';
import { useWeb3Context } from '../../../contexts/web3';
import { fetchTokenBalanceForConnectedWallet } from '../../../hooks/dex';
import chains from '../../../assets/chains.json';
import rpcCall from '../../../api/rpc';

type IStakeTokenModalProps = {
  token: string;
  pool: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function StakeTokenModal({ token, pool, isOpen, onClose }: IStakeTokenModalProps) {
  const { chainId, library } = useWeb3Context();
  const [isStakeLoading, setIsStakeLoading] = useState<boolean>(false);
  const balance = fetchTokenBalanceForConnectedWallet(token, [isStakeLoading]);
  const [selectedToken, setSelectedToken] = useState<Token>();
  const [stakingAmount, setStakingAmount] = useState<number>(0);
  const chain = useMemo(() => chains[chainId as unknown as keyof typeof chains], [chainId]);
  const [tax, setTax] = useState<number>(0);

  const initStake = useCallback(async () => {
    try {
      if (!!selectedToken || token === AddressZero) {
        setIsStakeLoading(true);
        const provider = new Web3Provider(library?.givenProvider);
        const tokenContract = token === AddressZero ? undefined : new Contract(token, erc20Abi, provider.getSigner());
        const poolContract = new Contract(pool, token !== AddressZero ? stakingPoolAbi : specialPoolAbi, provider.getSigner());
        const amountHex = `0x${_.multiply(stakingAmount, Math.pow(10, !!selectedToken ? selectedToken?.decimals : 18)).toString(16)}`;

        if (!!selectedToken && !!tokenContract) {
          const approvalTx = await tokenContract.approve(pool, amountHex);
          await approvalTx.wait();
          toast(`Pool approved to spend ${stakingAmount} ${selectedToken.symbol}`, { type: 'info' });
        }

        const stakeTx = token !== AddressZero ? await poolContract.stakeAsset(token, amountHex) : await poolContract.stakeEther({ value: amountHex });
        const stakeResponse = await stakeTx.wait();
        toast(
          <>
            <span className="text-white font-Montserrat text-[16px]">
              You have successfully staked your {!!selectedToken ? selectedToken.symbol : chain.symbol}
            </span>{' '}
            <a href={chain.explorer.concat(`/tx/${stakeResponse.transactionHash}`)} target="_blank" rel="noreferrer">
              View on explorer
            </a>
          </>,
          { type: 'success' }
        );
        setIsStakeLoading(false);
      }
    } catch (error: any) {
      setIsStakeLoading(false);
      toast(error.message, { type: 'error' });
      console.log(error);
    }
  }, [chain.explorer, chain.symbol, library?.givenProvider, pool, selectedToken, stakingAmount, token]);

  useEffect(() => {
    if (token && chainId && token !== AddressZero) {
      (async () => {
        const t = await Fetcher.fetchTokenData(chainId || 97, token);
        setSelectedToken(t);
      })();
    } else setSelectedToken(undefined);
  }, [token, chainId]);

  useEffect(() => {
    if (pool) {
      (async () => {
        try {
          const poolAbiInterface = new Interface(stakingPoolAbi);
          const taxHash = poolAbiInterface.getSighash('stakingPoolTax()');
          const taxCall = await rpcCall(chain.rpcUrl, { method: 'eth_call', params: [{ to: pool, data: taxHash }, 'latest'] });
          setTax(parseInt(taxCall));
        } catch (error: any) {
          console.log(error);
        }
      })();
    }
  }, [chain.rpcUrl, pool]);

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
                      <h2 className="text-2xl font-semibold">Stake {selectedToken?.symbol}</h2>
                      <button onClick={onClose} className="text-[#000] text-[30] p-[8px] flex justify-center rounded-[100%] bg-[#fff] font-[700]">
                        <FiX />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-center items-center w-full px-4 flex-col gap-3 py-2">
                    <div className="flex flex-col bg-[#0b0a13] border border-[#c7c7c7] gap-3 rounded-[10px] p-4 w-full">
                      <div className="flex justify-between w-full items-center font-Montserrat">
                        <span>Stake</span>
                        <span>Avail: {balance}</span>
                      </div>
                      <div className="flex justify-between items-center gap-4">
                        <input
                          type="number"
                          className="p-[12px] bg-transparent text-white border-0 w-full outline-0 appearance-none font-[600] text-[18px]"
                          value={stakingAmount}
                          onChange={(e) => setStakingAmount(e.target.valueAsNumber || 0)}
                        />
                        <button
                          onClick={() => setStakingAmount(parseFloat(balance))}
                          className="border border-[#fff] bg-[#f1f1f1]/[.11] py-[8px] px-[17px] rounded-[5px] uppercase"
                        >
                          Max
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={initStake}
                      disabled={(!selectedToken && token !== AddressZero) || isStakeLoading || stakingAmount <= 0}
                      className={`btn bg-[#1673b9]/50 rounded-[10px] text-[#000] w-full ${isStakeLoading ? 'loading' : ''}`}
                    >
                      Stake
                    </button>
                    <div className="flex justify-between items-center w-full font-Montserrat">
                      <span className="text-[20px] text-white font-[700]">Tax:</span>
                      <span className="text-[20px] text-white font-[500]">{tax}%</span>
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
