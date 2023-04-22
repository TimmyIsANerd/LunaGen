import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useState } from 'react';
import { RegularStakingPools, CreateNewStakingPool, PersonalPoolsAndEarnings, SpecialStakingPools } from '../routes/staking';

enum Routes {
  REGULAR_POOLS = 'regular',
  CREATE_NEW_POOL = 'new',
  SPECIAL_POOLS = 'special',
  MY_POOLS = 'owned'
}

const useStakingPoolsSubRoutes = (routes: Routes) => {
  const [component, setComponent] = useState(() => RegularStakingPools);

  useEffect(() => {
    switch (routes) {
      case Routes.REGULAR_POOLS:
        setComponent(() => RegularStakingPools);
        break;
      case Routes.SPECIAL_POOLS:
        setComponent(() => SpecialStakingPools);
        break;
      case Routes.CREATE_NEW_POOL:
        setComponent(() => CreateNewStakingPool);
        break;
      case Routes.MY_POOLS:
        setComponent(() => PersonalPoolsAndEarnings);
        break;
      default:
        setComponent(() => RegularStakingPools);
        break;
    }
  }, [routes]);
  return component;
};

export default function Staking() {
  const { query, push } = useRouter();
  const activeRoute = useMemo(() => (query.tab as Routes) || Routes.REGULAR_POOLS, [query.tab]);
  const RenderedChild = useStakingPoolsSubRoutes(query.tab as Routes);
  return (
    <>
      <Head>
        <title>LunaGens DeFi | Stake</title>
      </Head>
      <div className="flex-1 h-screen flex-col gap-12 w-full backdrop-opacity-10 backdrop-invert px-[2px] py-[12px] md:px-[82px] md:py-[44px] justify-start items-center overflow-auto hidden-scrollbar">
        <div className="flex flex-col md:flex-row justify-center items-center w-full gap-4 overflow-auto hidden-scrollbar">
          <div className="flex flex-row justify-center items-baseline text-[#fff] font-Montserrat w-full text-[12px]">
            <button
              className={`${activeRoute === Routes.REGULAR_POOLS ? 'border-b-[1px] border-[#0cedfc]' : 'border-b border-[#fff]/50'} w-1/4 py-2`}
              onClick={() => push(`/staking?tab=${Routes.REGULAR_POOLS}`)}
            >
              Regular Staking Pools
            </button>
            <button
              className={`${activeRoute === Routes.SPECIAL_POOLS ? 'border-b-[1px] border-[#0cedfc]' : 'border-b border-[#fff]/50'} w-1/4 py-2`}
              onClick={() => push(`/staking?tab=${Routes.SPECIAL_POOLS}`)}
            >
              Special Staking Pools
            </button>
            <button
              className={`${activeRoute === Routes.CREATE_NEW_POOL ? 'border-b-[1px] border-[#0cedfc]' : 'border-b border-[#fff]/50'} w-1/4 py-2`}
              onClick={() => push(`/staking?tab=${Routes.CREATE_NEW_POOL}`)}
            >
              Create New Pool
            </button>
            <button
              className={`${activeRoute === Routes.MY_POOLS ? 'border-b-[1px] border-[#0cedfc]' : 'border-b border-[#fff]/50'} w-1/4 py-2`}
              onClick={() => push(`/staking?tab=${Routes.MY_POOLS}`)}
            >
              My Pools & Rewards
            </button>
          </div>
          {/* <div className="bg-[#000]/[72] rounded-[20px] py-2 flex justify-center items-center gap-1 px-4">
            <FiSearch className="text-[#fff]" />
            <input className="bg-transparent outline-0 w-[120px] text-[#fff]" placeholder="Search pools" />
          </div> */}
        </div>

        <div className="w-full px-3 flex-1 overflow-auto hidden-scrollbar justify-center items-start flex py-4">
          <RenderedChild />
        </div>
      </div>
    </>
  );
}
