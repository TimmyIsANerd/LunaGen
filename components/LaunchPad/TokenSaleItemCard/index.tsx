import { Fetcher, Token } from 'quasar-sdk-core';
import React, { MouseEventHandler, useEffect, useMemo, useState } from 'react';
import Countdown from 'react-countdown';
import { formatEther, formatUnits } from '@ethersproject/units';
import _ from 'lodash';
import millify from 'millify';
import { TokenSaleItemModel } from '../../../api/models/launchpad';
import { useAPIContext } from '../../../contexts/api';
import { useWeb3Context } from '../../../contexts/web3';
import chains from '../../../assets/chains.json';
import { fetchSaleItemInfo } from '../../../hooks/launchpad';

type ISaleItemCardProps = {
  data: TokenSaleItemModel;
  onClick: (val: TokenSaleItemModel) => void;
};

const Timer = ({ date, completionText }: any) => {
  return (
    <Countdown
      date={date}
      renderer={({ days, hours, minutes, seconds, completed }) => (
        <>
          {completed ? (
            <span className="font-Montserrat text-white font-[700] uppercase">{completionText}</span>
          ) : (
            <span className="font-Montserrat text-white font-[700] text-[16px]">
              {days} Day(s) : {hours} Hr(s) : {minutes} Min(s) : {seconds} Sec(s)
            </span>
          )}
        </>
      )}
    />
  );
};

export default function PresaleItemCard({
  data: {
    id,
    token,
    hardCap,
    softCap,
    minContribution,
    maxContribution,
    startTime,
    endTime,
    rank,
    details,
    tokensForSale,
    presaleRate,
    proceedsTo,
    admin,
    chainId: chainid
  },
  onClick
}: ISaleItemCardProps) {
  const { tokensListingAsDictionary } = useAPIContext();
  const { chainId } = useWeb3Context();
  const [tokenObject, setTokenObject] = useState<Token>();

  const chain = useMemo(() => chains[chainId as unknown as keyof typeof chains], [chainId]);
  const { totalEtherRaised } = fetchSaleItemInfo(id);

  useEffect(() => {
    if (!!chainId) {
      (async () => {
        try {
          const t = await Fetcher.fetchTokenData(chainId, token, chain.rpcUrl);
          setTokenObject(t);
        } catch (error: any) {
          console.log(error);
        }
      })();
    }
  }, [chain.rpcUrl, chainId, token]);

  return (
    <>
      <div
        onClick={() =>
          onClick({
            id,
            token,
            hardCap,
            softCap,
            minContribution,
            maxContribution,
            startTime,
            endTime,
            rank,
            details,
            tokensForSale,
            presaleRate,
            proceedsTo,
            admin,
            chainId: chainid
          })
        }
        className="flex w-80 h-auto bg-[#161525] m-1 p-5 rounded-lg lg:w-85 cursor-pointer"
      >
        <div className="w-full flex flex-col ">
          <div className="flex items-center justify-between h-10 w-full">
            <div className="flex">
              <div className="avatar">
                <div className="w-16 rounded-full">
                  <img
                    src={
                      tokensListingAsDictionary[token.toLowerCase()]
                        ? tokensListingAsDictionary[token.toLowerCase()].logoURI
                        : '/images/placeholder_image.svg'
                    }
                    alt={token}
                  />
                </div>
              </div>
            </div>
            <div className="flex w-2/5 justify-around items-center">
              <span
                className={`flex items-center ${
                  rank !== 'unknown' ? (rank === 'gold' ? 'bg-[#d4af37]' : rank === 'silver' ? 'bg-[#bcc6cc]' : 'bg-[#cd7f32]') : 'bg-[#666362]'
                } text-white text-[10px] font-[600] rounded p-1`}
              >
                {rank}
              </span>
            </div>
          </div>
          <div className="flex flex-col w-full gap-1">
            <h2 className="text-[20px] uppercase text-[#fff] font-[800] pt-2 font-Montserrat">{tokenObject?.name}</h2>
            <h3 className="flex items-center justify-between text-[1rem] text-[#fff] capitalize font-[700] pb-2 font-Montserrat">
              <span>Max Contribution:</span>
              <span>
                {millify(parseFloat(formatEther(Number(maxContribution).toLocaleString('fullwide', { useGrouping: false }))))} {chain?.symbol}
              </span>
            </h3>
            <h3 className="flex items-center justify-between text-[1rem] text-[#fff] capitalize font-[700] pb-2 font-Montserrat">
              <span>Min Contribution:</span>
              <span>
                {millify(parseFloat(formatEther(Number(minContribution).toLocaleString('fullwide', { useGrouping: false }))))} {chain?.symbol}
              </span>
            </h3>
          </div>
          <div className="flex flex-col my-5">
            <span className="text-[#fff] font-Montserrat font-[600] pb-[0.099rem]">
              Progress (
              {_.multiply(parseInt(totalEtherRaised), 100) / Number(hardCap) > 100
                ? 100
                : _.multiply(parseInt(totalEtherRaised), 100) / Number(hardCap)}
              %)
            </span>
            <div className="h-[8px] bg-[#1673B9]">
              <div
                className="h-full bg-green-400"
                style={{
                  width: `${
                    _.multiply(parseInt(totalEtherRaised), 100) / Number(hardCap) > 100
                      ? 100
                      : _.multiply(parseInt(totalEtherRaised), 100) / Number(hardCap)
                  }%`
                }}
              />
            </div>
            <div className="flex justify-between text-center pt-[0.099rem]">
              <span className="text-[#fff] font-bold font-Montserrat">0</span>
              <span className="text-[#fff] font-bold font-Montserrat">
                {millify(parseFloat(formatEther(Number(hardCap).toLocaleString('fullwide', { useGrouping: false }))), { precision: 4 })}
              </span>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex justify-between mt-2">
              <span className="text-[#fff] font-bold font-Montserrat">Hard Cap:</span>
              <span className="text-[#fff] font-bold font-Montserrat">
                {millify(parseFloat(formatEther(Number(hardCap).toLocaleString('fullwide', { useGrouping: false }))), { precision: 4 })}{' '}
                {chain?.symbol}
              </span>
            </div>
            <div className="flex justify-between  mt-2">
              <span className="text-[#fff] font-bold font-Montserrat">Soft Cap:</span>
              <span className="text-[#fff] font-bold font-Montserrat">
                {millify(parseFloat(formatEther(Number(softCap).toLocaleString('fullwide', { useGrouping: false }))), { precision: 4 })}{' '}
                {chain?.symbol}
              </span>
            </div>
            <div className="flex justify-between  mt-2">
              <span className="text-[#fff] font-bold font-Montserrat">
                {tokenObject?.symbol} per {chain.symbol}:
              </span>
              <span className="text-[#fff] font-bold font-Montserrat">
                {tokenObject &&
                  millify(parseFloat(formatUnits(Number(presaleRate).toLocaleString('fullwide', { useGrouping: false }), tokenObject.decimals)), {
                    precision: 4
                  })}{' '}
                {tokenObject?.symbol}
              </span>
            </div>
          </div>
          <div className="flex ">
            <div className="flex w-full flex-col justify-center items-center mt-5 border-t-[0.03rem] border-t-[#5B5B5B] pt-3 gap-2">
              <div className="flex flex-col">
                <span className="text-[whitesmoke] text-sm font-Montserrat">Sale Starts In:</span>
                <Timer date={parseInt(startTime)} completionText="Started" />
              </div>
              <div className="flex flex-col">
                <span className="text-[whitesmoke] text-sm font-Montserrat">Sales Ends In:</span>
                <Timer date={parseInt(endTime)} completionText="Ended" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
