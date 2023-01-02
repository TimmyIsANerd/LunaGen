import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import StakingPoolCard from '../../components/Staking/StakingPoolCard';
import { useAPIContext } from '../../contexts/api';
import StakeEventsTableBodyItem from '../../components/Staking/StakeEventsTableBodyItem';

export default function PersonalPoolsAndEarnings() {
  const { accountStakingPools, stakesByAccount, fetchAccountPools, fetchStakesByAccount } = useAPIContext();
  const [page, setPage] = useState<number>(1);
  const [stakesPage, setStakesPage] = useState<number>(1);

  useEffect(() => {
    fetchAccountPools(page);
  }, [fetchAccountPools, page]);

  useEffect(() => {
    fetchStakesByAccount(stakesPage);
  }, [fetchStakesByAccount, stakesPage]);

  return (
    <div className="flex flex-col justify-center items-center gap-8">
      <div className="flex flex-col justify-center items-center w-full gap-2">
        <div className="flex flex-col md:flex-row justify-center items-center gap-3 flex-nowrap md:flex-wrap w-full flex-grow px-[4px]">
          {accountStakingPools.totalItems > 0 && (
            <>
              {_.map(accountStakingPools.items, (pool, index) => (
                <div className="px-[3px] py-[4px] w-full md:w-1/5" key={index}>
                  <StakingPoolCard key={index} pool={pool} poolType="regular" />
                </div>
              ))}
            </>
          )}
        </div>
        <div className="flex justify-center items-center gap-2 text-white/70">
          <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} className="bg-transparent">
            <FiArrowLeft />
          </button>
          <span>
            Page {page} of {Math.ceil(accountStakingPools.totalItems / 20)}
          </span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(accountStakingPools.totalItems / 20)} className="bg-transparent">
            <FiArrowRight />
          </button>
        </div>
      </div>

      <div className="flex flex-col justify-start items-start w-full md:w-[700px] font-poppins">
        <span className="font-[700] text-[20px] text-[#fff]">My Stakes & Rewards</span>
        <div className="bg-[#000]/50 px-4 rounded-[15px] overflow-auto py-[8px] shadow-lg flex justify-center items-center flex-col w-full hidden-scrollbar">
          <div className="table w-full border-separate bg-transparent overflow-auto border-spacing-y-[20px] border-spacing-x-[0px]">
            <div className="table-header-group w-full h-[50px]">
              <div className="table-row text-[#fff] w-full font-[800] uppercase gap-3">
                <div className="hidden md:table-cell text-left">Pool</div>
                <div className="hidden md:table-cell text-center">Date</div>
                <div className="table-cell text-center">Amount</div>
                <div className="table-cell text-center">Reward</div>
                <div className="table-cell text-center">Actions</div>
              </div>
            </div>
            <div className="table-row-group">
              {_.map(stakesByAccount.items, (ev, index) => (
                <StakeEventsTableBodyItem key={index} data={ev} />
              ))}
            </div>
          </div>
          <div className="flex justify-center items-center gap-2 text-white/70">
            <button onClick={() => setStakesPage((p) => p - 1)} disabled={stakesPage === 1} className="bg-transparent">
              <FiArrowLeft />
            </button>
            <span>
              Page {stakesPage} of {Math.ceil(stakesByAccount.totalItems / 20)}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={stakesPage >= Math.ceil(stakesByAccount.totalItems / 20)}
              className="bg-transparent"
            >
              <FiArrowRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
