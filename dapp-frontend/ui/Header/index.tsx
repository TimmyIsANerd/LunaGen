import React, { ReactElement, useState, useEffect, Children } from 'react';
import { Transition } from '@headlessui/react';
import Link, { LinkProps } from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { FaWallet } from 'react-icons/fa';
import { RiMenu4Fill } from 'react-icons/ri';
import { FiX, FiChevronDown, FiLogOut } from 'react-icons/fi';
import { formatEthAddress } from 'eth-address';
import { useWeb3Context } from '../../contexts/web3';
import ProviderSelectModal from '../ProviderSelectModal';
import { useCurrentChain } from '../../hooks/global';
import ChainSwitchModal from '../ChainSwitchModal';

type ActiveLinkProps = LinkProps & {
  children: ReactElement;
  activeClassName: string;
};

const ActiveLink = ({ children, activeClassName, ...props }: ActiveLinkProps) => {
  const { asPath, isReady } = useRouter();

  const child = Children.only(children);
  const childClassName = child.props.className || '';
  const [className, setClassName] = useState(childClassName);

  useEffect(() => {
    // Check if the router fields are updated client-side
    if (isReady) {
      // Dynamic route will be matched via props.as
      // Static route will be matched via props.href
      const linkPathname = new URL((props.as || props.href) as string, location.href).pathname;

      // Using URL().pathname to get rid of query and hash
      const activePathname = new URL(asPath, location.href).pathname;

      const newClassName = linkPathname === activePathname ? `${childClassName} ${activeClassName}`.trim() : childClassName;

      if (newClassName !== className) {
        setClassName(newClassName);
      }
    }
  }, [asPath, isReady, props.as, props.href, childClassName, activeClassName, setClassName, className]);

  return (
    <Link {...props}>
      {React.cloneElement(child, {
        className: className || null
      })}
    </Link>
  );
};

export default function Header() {
  const [showMobileSidebar, setShowMobileSidebar] = useState<boolean>(false);
  const [showProviderModal, setShowProviderModal] = useState<boolean>(false);
  const { active, account, error: web3Error, disconnectWallet } = useWeb3Context();
  const selectedChain = useCurrentChain();
  const [showChainSwitchModal, setShowChainSwitchModal] = useState<boolean>(false);
  const { push } = useRouter();

  function LogoCaption() {
    return (
      <div className='flex flex-row items-center' onClick={() => push('/')}>
        <Image src="/images/logo/lunagen.svg" alt="lunagen_logo" width={80} height={40} />
        <p className='font-bold text-[0.8rem] md-text-[1rem] hidden md:block'>LunaGens DeFi Staking</p>
      </div>
    )
  }

  return (
    <>
      {web3Error && (
        <div className="alert alert-error w-full rounded-[2px]">
          <div>
            <FiX />
            <span className="text-white font-poppins">{web3Error.message}</span>
          </div>
        </div>
      )}
      <div className="bg-[#063230]/[.08] w-full bg-opacity-90 shadow-lg font-Syne">
        <div className="flex flex-row justify-between px-[38px] py-[16px] items-center w-full">
          <div className="flex justify-center items-center cursor-pointer">
            <div>
              <LogoCaption />
            </div>
          </div>

          <div className='flex items-center flex-row'>
            <div className="md:flex flex-row justify-center items-center hidden w-auto gap-3">
              <div className="px-[23px] cursor-pointer">
                <ActiveLink activeClassName="font-[800] border-b-2 border-[#063230]" href="/dex">
                  <span className="text-white text-[1em] font-[400]">Swap</span>
                </ActiveLink>
              </div>
              {/* <div className="px-[23px] cursor-pointer">
              <ActiveLink activeClassName="font-[800] border-b-2 border-[#063230]" href="/analytics">
                <span className="text-white text-[1em] font-[400]">Analytics</span>
              </ActiveLink>
            </div> */}
              {/* <div className="px-[23px] cursor-pointer">
              <ActiveLink activeClassName="font-[800] border-b-2 border-[#063230]" href="/launchpad">
                <span className="text-white text-[1em] font-[400]">Launchpad</span>
              </ActiveLink>
            </div> */}
              <div className="px-[23px] cursor-pointer">
                <ActiveLink activeClassName="font-[800] border-b-2 border-[#063230]" href="/staking">
                  <span className="text-white text-[1em] font-[400]">Staking Pools</span>
                </ActiveLink>
              </div>
              {/* <div className="px-[23px] cursor-pointer">
              <ActiveLink activeClassName="font-[800] border-b-2 border-[#063230]" href="/multisig">
                <span className="text-white text-[1em] font-[400]">Multi-Signature</span>
              </ActiveLink>
            </div>
            <div className="px-[23px] cursor-pointer">
              <ActiveLink activeClassName="font-[800] border-b-2 border-[#063230]" href="/bridge">
                <span className="text-white text-[1em] font-[400]">Bridge</span>
              </ActiveLink>
            </div> */}
            </div>
            <div className="flex justify-center items-center gap-2">
              <div className="flex justify-center items-center gap-2 flex-1">
                <button
                  onClick={() => setShowChainSwitchModal(true)}
                  className="hidden md:flex justify-center items-center bg-[#fff]/[.09] py-[9px] px-[10px] rounded-[8px] text-[1em] text-white gap-2"
                >
                  <div className="avatar">
                    <div className="w-8 rounded-full">
                      <img src={selectedChain.logoURI} alt={selectedChain.symbol} />
                    </div>
                  </div>
                  {selectedChain.name} <FiChevronDown />
                </button>

                <div className="dropdown dropdown-hover">
                  <button
                    tabIndex={0}
                    onClick={() => !active && setShowProviderModal(true)}
                    className="hidden lg:flex justify-center items-center bg-[#063230] py-[13px] px-[10px] text-[1em] text-white gap-2 rounded-[8px]"
                  >
                    {active ? (
                      <>
                        <div className="h-[30px] w-[30px] rounded-[25px] flex justify-center items-center border border-white">
                          <FaWallet />
                        </div>{' '}
                        {formatEthAddress(account as string, 4)} <FiChevronDown />
                      </>
                    ) : (
                      <div className="flex justify-center items-center gap-2">
                        <FaWallet /> Connect Wallet
                      </div>
                    )}
                  </button>
                  {active && (
                    <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-[#000]/[0.6] rounded-box w-52 text-white">
                      <li>
                        <a onClick={disconnectWallet} className="btn btn-ghost gap-2">
                          {' '}
                          <FiLogOut /> Disconnect
                        </a>
                      </li>
                    </ul>
                  )}
                </div>
              </div>
              <div className="lg:hidden flex justify-center items-center gap-2">
                {active && (
                  <button
                    onClick={() => setShowChainSwitchModal(true)}
                    className="flex justify-center items-center btn btn-sm btn-ghost btn-square py-2 px-3 rounded-[5px] text-[18px] text-white"
                  >
                    <div className="avatar">
                      <div className="w-4 rounded-full">
                        <img src={selectedChain.logoURI} alt={selectedChain.symbol} />
                      </div>
                    </div>
                  </button>
                )}
                <button
                  onClick={() => (!active ? setShowProviderModal(true) : disconnectWallet())}
                  className="flex justify-center items-center bg-[#063230] py-2 px-4 text-[0.52em] text-white gap-2 rounded-[8px]"
                >
                  {active ? (
                    <>{formatEthAddress(account as string, 4)}</>
                  ) : (
                    <div className="flex justify-center items-center gap-2 capitalize">
                      <FaWallet /> connect wallet
                    </div>
                  )}
                </button>
                <button
                  className="flex justify-center items-center bg-transparent py-[9px] px-[10px] rounded-[5px] text-[1.6em] text-white"
                  onClick={() => setShowMobileSidebar((val) => !val)}
                >
                  {!showMobileSidebar ? <RiMenu4Fill /> : <FiX />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Transition
        as="div"
        className="flex flex-col lg:hidden gap-2 overflow-auto my-auto hidden-scrollbar justify-between items-center w-full px-4 py-4 z-20"
        enter="transform transition ease-in-out duration-[500ms]"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        show={showMobileSidebar}
      >
        <ul
          className="menu bg-[#1a1a1a] mx-auto min-h-full my-auto w-full p-2 rounded-box text-[#fff] font-Syne"
          onClick={() => setShowMobileSidebar(false)}
        >
          <li>
            <ActiveLink activeClassName="active" href="/dex">
              <span className="capitalize">Trade</span>
            </ActiveLink>
          </li>
          {/* <li>
            <ActiveLink activeClassName="active" href="/analytics">
              <span className="capitalize">analytics</span>
            </ActiveLink>
          </li> */}
          <li>
            <ActiveLink activeClassName="active" href="/staking">
              <span className="capitalize">staking pools</span>
            </ActiveLink>
          </li>
        </ul>
      </Transition>
      <ProviderSelectModal isOpen={showProviderModal} onClose={() => setShowProviderModal(false)} />
      <ChainSwitchModal isOpen={showChainSwitchModal} onClose={() => setShowChainSwitchModal(false)} />
    </>
  );
}
