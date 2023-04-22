import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ToggleButton from '../components/Button/ToggleButton';
import { Liquidity, Swap } from '../routes/dex';

enum Route {
  SWAP = 'swap',
  LIQUIDITY = 'liquidity'
}

const useDEXSubRoutes = (routes: Route) => {
  const [component, setComponent] = useState(() => Swap);

  useEffect(() => {
    switch (routes) {
      case Route.SWAP:
        setComponent(() => Swap);
        break;
      case Route.LIQUIDITY:
        setComponent(() => Liquidity);
        break;
      default:
        setComponent(() => Swap);
        break;
    }
  }, [routes]);
  return component;
};

export default function Dex() {
  const { query, push } = useRouter();
  const RenderedChild = useDEXSubRoutes(query.tab as Route);
  const route = useMemo(() => (query.tab as Route) || Route.SWAP, [query.tab]);
  return (
    <>
      <Head>
        <title>LunaGens DeFi | DEX</title>
      </Head>
      <div className="flex justify-center items-center my-16 w-full">
        <div className="flex justify-center items-center my-[3px] rounded-[18px] bg-white py-[2px] px-[4px]">
          <ToggleButton isActive={route === Route.SWAP} onClick={() => push(`/dex?tab=${Route.SWAP}`)}>
            <span>Swap</span>
          </ToggleButton>
          <ToggleButton isActive={route === Route.LIQUIDITY} onClick={() => push(`/dex?tab=${Route.LIQUIDITY}`)}>
            <span>Liquidity</span>
          </ToggleButton>
        </div>
      </div>
      <div className="flex justify-center items-center my-16 px-1 w-full">
        <RenderedChild />
      </div>
    </>
  );
}
