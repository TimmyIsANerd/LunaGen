import Head from 'next/head';
import Link from 'next/link';
import { FiCheckCircle } from 'react-icons/fi';
import { MdSwapHoriz } from 'react-icons/md';
import { useRouter } from 'next/router';
import { map } from 'lodash';
import chains from '../assets/chains.json';
import { useStakingPoolFactoriesStats } from '../hooks/staking';
import millify from 'millify';
import { useQuasarFactoriesStats } from '../hooks/analytics';
import Image from 'next/image';

export default function Index() {
  const stakingPoolStats = useStakingPoolFactoriesStats();
  const { data: dexFactoryData } = useQuasarFactoriesStats();
  const { push } = useRouter();

  const Button = ({ href, children }: any) => {
    return (
      <button onClick={() => push(href)} className='uppercase bg-gradient-to-br from-gray-800 to-teal-900 text-white shadow-md py-2 px-7 rounded-sm font-normal hover:shadow-lg duration-500'>
        {children}
      </button>
    )
  }

  return (
    <>
      <Head>
        <title>Lunagens DeFi Staking | Homepage</title>
      </Head>
      <div className="w-full min-h-full flex md:flex-row flex-col justify-center items-center">
        <div className='space-y-5'>
          <div className='text-white space-y-5'>
            <h2 className='font-bold md:text-[3rem] text-[2rem] leading-[3.5rem]'>Just stake some<br /> tokens to earn</h2>
            <p className='md:text-[2.2rem] text-['>High APR, Low Risk<br />Create pools for your project</p>
          </div>
          <div className='flex flex-row gap-x-3'>
            <Button href="https://pancakeswap.finance/swap?outputCurrency=0x28B9aed756De31B6b362aA0f23211D13093EBb79">Buy<br /> Lunagens</Button>
            <Button href="/staking">Create<br /> Pool</Button>
            <Button href="https://docs.google.com/forms/d/e/1FAIpQLSc9NK4x0_T0xcV9cp5ZoWPb5cVWUg09G_WGVTUcgxaC6HypWQ/viewform" target='_blank' >Request A<br /> Pool</Button>
          </div>
        </div>
        <Image src="/images/buildings.png" width={640} height={640} objectFit="contain" />
      </div>
    </>
  );
}
