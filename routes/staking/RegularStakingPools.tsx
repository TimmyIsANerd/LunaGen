import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import StakingPoolCard from '../../components/Staking/StakingPoolCard';
import { useAPIContext } from '../../contexts/api';

export default function RegularStakingPools() {
  const { stakingPools, fetchPools } = useAPIContext();
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    fetchPools(page);
  }, [fetchPools, page]);

  return (
    <div className="flex flex-col gap-2 justify-center items-center w-full">
      <div className="flex flex-col md:flex-row justify-center items-center gap-3 flex-nowrap md:flex-wrap w-full flex-1 px-[4px]">
        {stakingPools.totalItems > 0 && (
          <>
            {_.map(stakingPools.items, (pool, index) => (
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
          Page {page} of {Math.ceil(stakingPools.totalItems / 20)}
        </span>
        <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(stakingPools.totalItems / 20)} className="bg-transparent">
          <FiArrowRight />
        </button>
      </div>
    </div>
  );
}
