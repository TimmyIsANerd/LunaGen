import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { FaParachuteBox } from 'react-icons/fa';
import { FiShield, FiLock, FiDollarSign, FiSettings, FiNavigation } from 'react-icons/fi';
import { TiArrowShuffle } from 'react-icons/ti';
import { NavLink, LaunchpadNavbar } from '../components/LaunchPad';
import { Presales } from '../routes/launchpad';

enum Routes {
  PRESALES = 'presales',
  UNDER_CONSTRUCTION = 'under_construction'
}

const UnderConstruction = () => (
  <div className="flex justify-center items-center w-full my-[100px]">
    <div className="flex flex-col-reverse justify-center items-center gap-6">
      <span className="text-white font-[700] text-[18px] md:text-[50px] font-Montserrat">Page under construction!</span>
      <Image src="/images/under_construction.svg" width={398.34} height={378} alt="connect_wallet" />
    </div>
  </div>
);

const useLaunchpadSubRoutes = (routes: Routes) => {
  const [component, setComponent] = useState(() => Presales);

  useEffect(() => {
    switch (routes) {
      case Routes.PRESALES:
        setComponent(() => Presales);
        break;
      case Routes.UNDER_CONSTRUCTION:
        setComponent(() => UnderConstruction);
        break;
      default:
        setComponent(() => Presales);
        break;
    }
  }, [routes]);
  return component;
};

export default function Launchpad() {
  const { query, push } = useRouter();
  const RenderedChild = useLaunchpadSubRoutes(query.tab as Routes);
  const route = useMemo(() => (query.tab as Routes) || Routes.PRESALES, [query.tab]);
  return (
    <>
      <Head>
        <title>Vefi DApps | Launchpad</title>
      </Head>
      {/* <div className="flex justify-center items-center w-full my-[100px]">
        <div className="flex flex-col-reverse justify-center items-center gap-6">
          <span className="text-white font-[700] text-[18px] md:text-[50px] font-Montserrat">Page under construction!</span>
          <Image src="/images/under_construction.svg" width={398.34} height={378} alt="connect_wallet" />
        </div>
      </div> */}
      <div className="flex flex-col md:flex-row w-screen h-screen overflow-auto hidden-scrollbar">
        <div className="w-full md:w-80 py-10 px-5 h-[40px] md:h-full bg-[#161525] text-white">
          <LaunchpadNavbar>
            <NavLink
              label="Presales"
              icon={<TiArrowShuffle className="text-white" />}
              dropdown
              onClick={() => push(`/launchpad?tab=${Routes.PRESALES}`)}
              active={`${route === Routes.PRESALES ? 'text-[#46aefc]' : 'text-[#fff]'}`}
            />
            <NavLink
              label="Private sales"
              icon={<FiDollarSign className="text-white" />}
              dropdown
              onClick={() => push(`/launchpad?tab=${Routes.UNDER_CONSTRUCTION}`)}
            />
            <NavLink
              label="Airdrops"
              icon={<FaParachuteBox className="text-white" />}
              dropdown
              onClick={() => push(`/launchpad?tab=${Routes.UNDER_CONSTRUCTION}`)}
            />
            <NavLink
              label="Locks"
              icon={<FiLock className="text-white" />}
              dropdown
              onClick={() => push(`/launchpad?tab=${Routes.UNDER_CONSTRUCTION}`)}
            />
            <NavLink
              label="Utitlty &amp; Tools"
              icon={<FiSettings className="text-white" />}
              dropdown
              onClick={() => push(`/launchpad?tab=${Routes.UNDER_CONSTRUCTION}`)}
            />
            <NavLink
              label="Listing Alerts (Beta)"
              icon={<FiNavigation className="text-white" onClick={() => push(`/launchpad?tab=${Routes.UNDER_CONSTRUCTION}`)} />}
            />
            <NavLink
              label="KYC &amp; Audit"
              icon={<FiShield className="text-white" />}
              onClick={() => push(`/launchpad?tab=${Routes.UNDER_CONSTRUCTION}`)}
            />
          </LaunchpadNavbar>
        </div>
        <div className="w-screen p-5">
          <RenderedChild />
        </div>
      </div>
    </>
  );
}
