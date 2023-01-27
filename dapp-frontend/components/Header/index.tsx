import React, { ReactElement, useState, useEffect, Children, useMemo } from 'react';
import { Transition } from '@headlessui/react';
import Link, { LinkProps } from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { FaWallet, FaDiceSix, FaHandshake } from 'react-icons/fa';
import { RiMenu4Fill } from 'react-icons/ri';
import { FiX, FiChevronDown, FiLogOut, FiCheck, FiLink } from 'react-icons/fi';
import { BsCurrencyExchange } from 'react-icons/bs';
import { SiLaunchpad } from 'react-icons/si';
import { formatEthAddress } from 'eth-address';
import _ from 'lodash';
import { hexValue } from '@ethersproject/bytes';
import { useWeb3Context } from '../../contexts/web3';
import ProviderSelectModal from '../ProviderSelectModal';
import chains from '../../assets/chains.json';

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
  const { active, account, error: web3Error, disconnectWallet, chainId, switchChain } = useWeb3Context();
  const selectedChain = useMemo(() => chains[(chainId as unknown as keyof typeof chains) || 97], [chainId]);
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
      <div className="bg-[#0f0f10]/[.08] lg:border-b border-[#5e5e5e] w-full font-Syne">
        <div className="flex flex-row justify-between px-[38px] py-[16px] items-center w-full">
          <div className="flex justify-center items-center cursor-pointer">
            <Link href="/">
              <Image src="/images/vefi.svg" alt="vefi_logo" width={80} height={40} />
            </Link>
          </div>
          <div className="md:flex flex-row justify-center items-center hidden w-auto gap-3">
            <div className="px-[23px] cursor-pointer">
              <ActiveLink activeClassName="font-[800]" href="/dex">
                <span className="text-white text-[1em] font-[400]">Trade</span>
              </ActiveLink>
            </div>
            <div className="px-[23px] cursor-pointer">
              <ActiveLink activeClassName="font-[800]" href="/launchpad">
                <span className="text-white text-[1em] font-[400]">Launchpad</span>
              </ActiveLink>
            </div>
            <div className="px-[23px] cursor-pointer">
              <ActiveLink activeClassName="font-[800]" href="/staking">
                <span className="text-white text-[1em] font-[400]">Staking Pools</span>
              </ActiveLink>
            </div>
            <div className="px-[23px] cursor-pointer">
              <ActiveLink activeClassName="font-[800]" href="/multisig">
                <span className="text-white text-[1em] font-[400]">Multi-Signature</span>
              </ActiveLink>
            </div>
            <div className="px-[23px] cursor-pointer">
              <ActiveLink activeClassName="font-[800]" href="/bridge">
                <span className="text-white text-[1em] font-[400]">Bridge</span>
              </ActiveLink>
            </div>
          </div>
          <div className="flex justify-center items-center gap-2">
            <div className="flex justify-center items-center gap-2 flex-1">
              <div className="dropdown dropdown-hover">
                <button
                  tabIndex={0}
                  className="hidden md:flex justify-center items-center bg-transparent py-[9px] px-[10px] rounded-[25px] text-[1em] text-white gap-2"
                >
                  <div className="avatar">
                    <div className="w-8 rounded-full">
                      <img src={selectedChain.logoURI} alt={selectedChain.symbol} />
                    </div>
                  </div>
                  {selectedChain.name} <FiChevronDown />
                </button>
                <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-[#000] w-80 rounded-box text-white">
                  {_.map(Object.keys(chains), (key, index) => (
                    <li key={index}>
                      <a className="gap-2 text-[1em]" onClick={() => switchChain(hexValue(parseInt(key)))}>
                        <div className="avatar">
                          <div className="w-8 rounded-full">
                            <img src={chains[key as keyof typeof chains].logoURI} alt={chains[key as keyof typeof chains].symbol} />
                          </div>
                        </div>
                        {chains[key as keyof typeof chains].name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="dropdown dropdown-hover">
                <button
                  tabIndex={0}
                  onClick={() => !active && setShowProviderModal(true)}
                  className="hidden md:flex justify-center items-center bg-[#105dcf] py-[9px] px-[10px] text-[1em] text-white gap-2 rounded-[8px]"
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
            <button
              className="md:hidden flex justify-center items-center bg-transparent py-[9px] px-[10px] rounded-[5px] text-[1.6em] text-white"
              onClick={() => setShowMobileSidebar((val) => !val)}
            >
              {!showMobileSidebar ? <RiMenu4Fill /> : <FiX />}
            </button>
          </div>
        </div>
      </div>
      <Transition
        as="div"
        className="flex flex-row md:hidden bg-[#000]/80 h-[50px] gap-2 overflow-auto hidden-scrollbar justify-between items-center w-full px-4 py-4"
        enter="transform transition ease-in-out duration-[500ms]"
        enterFrom="opacity-0 -translate-y-6]"
        enterTo="opacity-100 translate-y-0"
        show={showMobileSidebar}
      >
        <div className="flex justify-center items-center gap-4 h-full">
          <div className="cursor-pointer">
            <ActiveLink activeClassName="text-[#0cedfc]" href="/dex">
              <BsCurrencyExchange className="text-[#fff] text-[40px]" />
            </ActiveLink>
          </div>
          <div className="cursor-pointer">
            <ActiveLink activeClassName="text-[#0cedfc]" href="/launchpad">
              <SiLaunchpad className="text-[#fff] text-[40px]" />
            </ActiveLink>
          </div>
          <div className="cursor-pointer">
            <ActiveLink activeClassName="text-[#0cedfc]" href="/staking">
              <FaDiceSix className="text-[#fff] text-[40px]" />
            </ActiveLink>
          </div>
          <div className="cursor-pointer">
            <ActiveLink activeClassName="text-[#0cedfc]" href="/multisig">
              <FaHandshake className="text-[#fff] text-[40px]" />
            </ActiveLink>
          </div>
          <div className="cursor-pointer">
            <ActiveLink activeClassName="text-[#0cedfc]" href="/bridge">
              <FiLink className="text-[#fff] text-[40px]" />
            </ActiveLink>
          </div>
        </div>
        {!active ? (
          <button
            onClick={() => setShowProviderModal(true)}
            className="md:hidden flex justify-center items-center bg-[#1673b9] py-[9px] px-[10px] rounded-[5px] text-[18px] text-white"
          >
            <FaWallet />
          </button>
        ) : (
          <div className="flex justify-center items-center gap-2">
            <label
              htmlFor="chain-modal"
              className="md:hidden flex justify-center items-center bg-[#000]/40 py-[9px] px-[10px] rounded-[5px] text-[18px] text-white"
            >
              <div className="avatar">
                <div className="w-8 rounded-full">
                  <img src={selectedChain.logoURI} alt={selectedChain.symbol} />
                </div>
              </div>
            </label>
            <button
              onClick={disconnectWallet}
              className="md:hidden flex justify-center items-center bg-green-500 py-[9px] px-[10px] rounded-[5px] text-[18px] text-white"
            >
              <FiCheck />
            </button>
          </div>
        )}
      </Transition>
      <ProviderSelectModal isOpen={showProviderModal} onClose={() => setShowProviderModal(false)} />
      <input type="checkbox" id="chain-modal" className="modal-toggle" />
      <div className="modal modal-bottom">
        <div className="modal-box relative bg-[#000]">
          <label htmlFor="chain-modal" className="btn btn-sm btn-circle absolute right-2 top-2">
            <FiX />
          </label>
          <ul className="menu p-2 shadow bg-[#000]/[0.6] rounded-box w-full text-white">
            {_.map(Object.keys(chains), (key, index) => (
              <li key={index}>
                <label htmlFor="chain-modal" className="gap-2" onClick={() => switchChain(hexValue(parseInt(key)))}>
                  <div className="avatar">
                    <div className="w-8 rounded-full">
                      <img src={chains[key as keyof typeof chains].logoURI} alt={chains[key as keyof typeof chains].symbol} />
                    </div>
                  </div>
                  {chains[key as keyof typeof chains].name}
                </label>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
