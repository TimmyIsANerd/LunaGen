import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useState } from 'react';
import CreateStakingPoolModal from '../ui/Staking/CreateStakingPoolModal';
import SquareToggleButton from '../ui/Button/SquareToggleButton';
import { AllPools, AccountPools, AccountStakes } from '../routes/staking';

enum Tabs {
  ALL_POOLS = 'all_pools',
  MY_POOLS = 'my_pools',
  MY_STAKES = 'my_stakes'
}

const useStakingView = (tab: Tabs) => {
  const [component, setComponent] = useState(() => AllPools);

  useEffect(() => {
    switch (tab) {
      case Tabs.ALL_POOLS:
        setComponent(() => AllPools);
        break;
      case Tabs.MY_POOLS:
        setComponent(() => AccountPools);
        break;
      case Tabs.MY_STAKES:
        setComponent(() => AccountStakes);
        break;
      default:
        setComponent(() => AllPools);
        break;
    }
  }, [tab]);
  return component;
};

export default function Staking() {
  const { query, push, asPath } = useRouter();
  const tab = useMemo(() => (query.tab as Tabs) || Tabs.ALL_POOLS, [query.tab]);
  const [showCreatePoolModal, setShowCreatePoolModal] = useState<boolean>(false);
  const RenderedChild = useStakingView(tab);
  return (
    <>
      <Head>
        <title>Lunagens DeFi Staking | Stake</title>
      </Head>
      <div className="flex container mx-auto flex-col justify-center items-start gap-12 px-8 lg:px-10 py-4">
        <div className="flex flex-col lg:flex-row justify-start items-center lg:justify-between lg:items-center gap-2 w-full">
          <div className="flex flex-col gap-1 lg:justify-center lg:items-start justify-start items-center">
            <span className="capitalize font-Syne text-[#fff] font-[700] text-[1.2em] lg:text-[1.9em]">stake & earn rewards</span>
            <span className="capitalize font-Inter text-[#aeaeae] font-[400] text-[0.5em] lg:text-[0.9em]">
              increase your financial capacity through engagement in staking programs.
            </span>
          </div>
          <button
            onClick={() => setShowCreatePoolModal(true)}
            className="capitalize font-Inter font-[500] border bg-gradient-to-br from-gray-800 to-teal-900 text-[#fff] rounded-[8px] lg:px-4 px-1 lg:py-2 py-1 shadow-[0_1px_2px_rgba(16,_24,_40,_0.05)]"
          >
            create new pool
          </button>
        </div>
        <div className="flex flex-col justify-start items-center lg:items-start w-full gap-5">
          <div className="flex justify-start items-center gap-2 lg:gap-4 w-auto capitalize">
            <SquareToggleButton
              isActive={tab === Tabs.ALL_POOLS}
              onClick={() => push(`${new URL(asPath, window.location.href).pathname}?tab=${Tabs.ALL_POOLS}`)}
            >
              <span className="capitalize">all pools</span>
            </SquareToggleButton>
            <SquareToggleButton
              isActive={tab === Tabs.MY_POOLS}
              onClick={() => push(`${new URL(asPath, window.location.href).pathname}?tab=${Tabs.MY_POOLS}`)}
            >
              <span className="capitalize">my pools</span>
            </SquareToggleButton>
            <SquareToggleButton
              isActive={tab === Tabs.MY_STAKES}
              onClick={() => push(`${new URL(asPath, window.location.href).pathname}?tab=${Tabs.MY_STAKES}`)}
            >
              <span className="capitalize">my stakes</span>
            </SquareToggleButton>
          </div>
          <RenderedChild />
        </div>
        <CreateStakingPoolModal isOpen={showCreatePoolModal} onClose={() => setShowCreatePoolModal(false)} />
      </div>
    </>
  );
}
