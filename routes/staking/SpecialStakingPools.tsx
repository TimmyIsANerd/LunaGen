import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import StakingPoolCard from '../../components/Staking/StakingPoolCard';
import { useAPIContext } from '../../contexts/api';

export default function SpecialStakingPools() {
  const { specialStakingPools, fetchSpecialPools } = useAPIContext();
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    fetchSpecialPools(page);
  }, [fetchSpecialPools, page]);

  return (
    <div className="flex flex-col gap-2 justify-center items-center w-full flex-1 overflow-auto">
      <div className="flex flex-col md:flex-row justify-start md:justify-center items-center gap-2 flex-wrap w-full flex-1 overflow-auto hidden-scrollbar">
        {specialStakingPools.totalItems > 0 && (
          <>
            {_.map(specialStakingPools.items, (pool, index) => (
              <div className="px-[3px] py-[4px] w-full md:w-1/5 overflow-auto" key={index}>
                <StakingPoolCard key={index} pool={pool} poolType="special" />
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
          Page {page} of {Math.ceil(specialStakingPools.totalItems / 20)}
        </span>
        <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(specialStakingPools.totalItems / 20)} className="bg-transparent">
          <FiArrowRight />
        </button>
      </div>
    </div>
  );
}
