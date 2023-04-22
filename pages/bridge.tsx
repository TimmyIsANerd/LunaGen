import React from 'react';
import Head from 'next/head';
import Image from 'next/image';

export default function Bridge() {
  return (
    <>
      <Head>
        <title>LunaGens DeFi | Bridge</title>
      </Head>
      <div className="flex justify-center items-center w-full my-[100px]">
        <div className="flex flex-col-reverse justify-center items-center gap-6">
          <span className="text-white font-[700] text-[18px] md:text-[50px] font-Montserrat">Page under construction!</span>
          <Image src="/images/under_construction.svg" width={398.34} height={378} alt="connect_wallet" />
        </div>
      </div>
    </>
  );
}
