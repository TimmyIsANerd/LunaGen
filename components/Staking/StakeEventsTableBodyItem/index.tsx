import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiExternalLink } from 'react-icons/fi';
import { isAddress } from '@ethersproject/address';
import { hexStripZeros } from '@ethersproject/bytes';
import { AddressZero } from '@ethersproject/constants';
import { Contract } from '@ethersproject/contracts';
import { Web3Provider } from '@ethersproject/providers';
import { formatEthAddress } from 'eth-address';
import _ from 'lodash';
import { Fetcher, Token } from 'quasar-sdk-core';
import { ToastContainer, toast } from 'react-toastify';
import { abi as stakingPoolAbi } from 'vefi-token-launchpad-staking/artifacts/contracts/StakingPool.sol/StakingPool.json';
import { StakeEventModel } from '../../../api/models/staking';
import { fetchStakeEventPoolAndReward, fetchStakingPoolInfo } from '../../../hooks/staking';
import { useWeb3Context } from '../../../contexts/web3';
import chains from '../../../assets/chains.json';

type IStakeEventsTableBodyItemProps = {
  data: StakeEventModel;
};

export default function StakeEventsTableBodyItem({ data }: IStakeEventsTableBodyItemProps) {
  const { chainId, library } = useWeb3Context();
  const poolAndRewards = fetchStakeEventPoolAndReward(data.transactionHash, data.stake, chainId || 97);
  const poolInfo = fetchStakingPoolInfo(poolAndRewards.pool, chainId || 97);
  const [rewardToken, setRewardToken] = useState<Token>();
  const [stakedToken, setStakedToken] = useState<Token>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const chain = useMemo(() => chains[chainId as unknown as keyof typeof chains], [chainId]);

  const withdrawal = useCallback(async () => {
    try {
      if (poolInfo.id) {
        setIsLoading(true);
        const provider = new Web3Provider(library?.givenProvider);
        const stakingPoolContract = new Contract(poolInfo.id, stakingPoolAbi, provider.getSigner());
        const withdrawalTx = await stakingPoolContract.withdrawRewards(data.stake);
        const withdrawalResponse = await withdrawalTx.wait();

        toast(
          <>
            <span className="text-white font-Montserrat text-[16px]">You have successfully withdrawn your reward</span>{' '}
            <a href={chain.explorer.concat(`/tx/${withdrawalResponse.transactionHash}`)} target="_blank" rel="noreferrer">
              View on explorer
            </a>
          </>,
          { type: 'success' }
        );
        setIsLoading(false);
      }
    } catch (error: any) {
      setIsLoading(false);
      toast(error.message, { type: 'error' });
      console.log(error);
    }
  }, [chain.explorer, data.stake, library?.givenProvider, poolInfo.id]);

  const unstake = useCallback(async () => {
    try {
      if (poolInfo.id) {
        setIsLoading(true);
        const provider = new Web3Provider(library?.givenProvider);
        const stakingPoolContract = new Contract(poolInfo.id, stakingPoolAbi, provider.getSigner());
        const unstakeTx = await stakingPoolContract.unstakeAll(data.stake);
        const unstakeResponse = await unstakeTx.wait();

        toast(
          <>
            <span className="text-white font-Montserrat text-[16px]">You have successfully unstaked your tokens</span>{' '}
            <a href={chain.explorer.concat(`/tx/${unstakeResponse.transactionHash}`)} target="_blank" rel="noreferrer">
              View on explorer
            </a>
          </>,
          { type: 'success' }
        );
        setIsLoading(false);
      }
    } catch (error: any) {
      setIsLoading(false);
      toast(error.message, { type: 'error' });
      console.log(error);
    }
  }, [chain.explorer, data.stake, library?.givenProvider, poolInfo.id]);

  useEffect(() => {
    if (poolInfo.tokenA || poolInfo.tokenB) {
      (async () => {
        const url = chain.rpcUrl;
        const sToken = data.token !== AddressZero ? await Fetcher.fetchTokenData(chainId || 97, hexStripZeros(data.token), url) : undefined;
        if (
          _.isEqual(data.token !== AddressZero ? hexStripZeros(data.token.toLowerCase()) : data.token.toLowerCase(), poolInfo.tokenA.toLowerCase())
        ) {
          const rToken = await Fetcher.fetchTokenData(chainId || 97, poolInfo.tokenB, url);
          setRewardToken(rToken);
        } else if (_.isEqual(hexStripZeros(data.token.toLowerCase()), poolInfo.tokenB.toLowerCase())) {
          const rToken = await Fetcher.fetchTokenData(chainId || 97, poolInfo.tokenA, url);
          setRewardToken(rToken);
        }
        setStakedToken(sToken);
      })();
    }
  }, [chain.rpcUrl, chainId, data.token, poolInfo.tokenA, poolInfo.tokenB]);

  return (
    <div className="table-row text-[#fff] h-[50px] font-poppins hover:bg-[#000]/30 cursor-pointer">
      <div className="hidden md:table-cell text-center px-2">
        <div className="flex justify-start gap-1 items-center">
          <span>{isAddress(poolAndRewards.pool) ? formatEthAddress(poolAndRewards.pool, 4) : poolAndRewards.pool}</span>
          <a href={chain.explorer.concat(`/address/${poolAndRewards.pool}`)} target="_blank" rel="noreferrer">
            <FiExternalLink className="text-[blue]/50" />
          </a>
        </div>
      </div>
      <div className="hidden md:table-cell text-center">{new Date(data.timestamp).toLocaleDateString()}</div>
      <div className="table-cell text-center">
        {!!stakedToken
          ? _.divide(parseInt(data.amount), Math.pow(10, stakedToken.decimals)).toPrecision(4)
          : _.divide(parseInt(data.amount), Math.pow(10, 18)).toPrecision(4)}{' '}
        {stakedToken?.symbol || chain.symbol}
      </div>
      <div className="table-cell text-center">
        {!!rewardToken && !!poolAndRewards && _.divide(poolAndRewards.reward, Math.pow(10, rewardToken.decimals)).toPrecision(4)}{' '}
        {rewardToken?.symbol}
      </div>
      <div className="table-cell text-center">
        <div className="flex justify-center gap-2 items-center">
          <button onClick={withdrawal} disabled={!poolInfo || isLoading} className={`btn bg-[#1673b9]/50 ${isLoading ? 'loading' : ''}`}>
            Withdraw
          </button>
          <button onClick={unstake} disabled={!poolInfo || isLoading} className="btn bg-[#000]/50">
            Unstake
          </button>
        </div>
      </div>
      <ToastContainer position="top-right" theme="dark" autoClose={5000} />
    </div>
  );
}
