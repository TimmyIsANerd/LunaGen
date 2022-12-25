/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, createContext, useContext, useEffect, useCallback } from 'react';
import { useWeb3React } from '@web3-react/core';
import { InjectedConnector } from '@web3-react/injected-connector';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';
import { TorusConnector } from '@web3-react/torus-connector';
import { formatEther } from '@ethersproject/units';
import type Web3 from 'web3';
import { OkxWalletConnector } from '../web3/custom/OkxWalletConnector';
import chains from '../assets/chains.json';

type Web3ContextType = {
  account?: string | null;
  library?: Web3;
  chainId?: number;
  active: boolean;
  error?: Error;
  balance?: string;
  connectInjected: () => void;
  connectWalletConnect: () => void;
  connectTorus: () => void;
  connectOkxWallet: () => void;
  disconnectWallet: () => void;
};

const Web3Context = createContext<Web3ContextType>({} as Web3ContextType);

const injectedConnector = new InjectedConnector({
  supportedChainIds: [56, 137, 32520, 1024, 43114, 40, 86, 97, 311, 888, 66, 1]
});

const okxwalletConnector = new OkxWalletConnector({
  supportedChainIds: [56, 137, 32520, 1024, 43114, 40, 86, 97, 311, 888, 66, 1]
});

const walletConnectConnector = new WalletConnectConnector({
  qrcode: true,
  bridge: 'https://bridge.walletconnect.org',
  supportedChainIds: [56, 137, 32520, 1024, 43114, 40, 86, 97, 311, 888, 66, 1],
  rpc: {
    56: chains[56].rpcUrl,
    32520: chains[32520].rpcUrl,
    86: chains[86].rpcUrl,
    311: chains[311].rpcUrl,
    97: chains[97].rpcUrl,
    888: chains[888].rpcUrl,
    66: chains[66].rpcUrl,
    1: chains[1].rpcUrl
  }
});

const torusConnector = new TorusConnector({
  chainId: 1
});

export const Web3ContextProvider = ({ children }: any) => {
  const { library, account, activate, deactivate, active, chainId, error, setError } = useWeb3React<Web3>();
  const [balance, setBalance] = useState<string>('0');

  const fetchBalance = useCallback(() => {
    if (!!account) {
      library?.eth
        .getBalance(account)
        .then((val) => setBalance(formatEther(val)))
        .catch((err) => setError(err));
    }
  }, [account, chainId]);

  const connectInjected = useCallback(() => {
    activate(injectedConnector, setError, true)
      .then(() => {
        console.log('Metamask connected!');
      })
      .catch(setError);
  }, []);

  const connectWalletConnect = useCallback(() => {
    activate(walletConnectConnector, setError, true)
      .then(() => {
        console.log('Walletconnect connected!');
      })
      .catch(setError);
  }, []);

  const connectTorus = useCallback(() => {
    activate(torusConnector, setError, true)
      .then(() => {
        console.log('Torus connected!');
      })
      .catch(setError);
  }, []);

  const connectOkxWallet = useCallback(() => {
    activate(okxwalletConnector, setError, true)
      .then(() => {
        console.log('Okx Connected!');
      })
      .catch(setError);
  }, []);

  const disconnectWallet = useCallback(() => {
    if (active) deactivate();
  }, [active]);

  useEffect(() => {
    injectedConnector.isAuthorized().then((isAuth) => {
      if (isAuth) {
        activate(injectedConnector, setError, true)
          .then(() => {
            console.log('Connected!');
          })
          .catch(setError);
      }
    });
  }, []);

  useEffect(() => {
    okxwalletConnector.isAuthorized().then((isAuth) => {
      if (isAuth) {
        activate(okxwalletConnector, setError, true)
          .then(() => {
            console.log('Connected!');
          })
          .catch(setError);
      }
    });
  }, []);

  useEffect(() => {
    if (active && !!account) {
      fetchBalance();
    }
  }, [active, account]);

  return (
    <Web3Context.Provider
      value={{
        library,
        balance,
        account,
        active,
        connectInjected,
        connectWalletConnect,
        connectTorus,
        connectOkxWallet,
        error,
        disconnectWallet,
        chainId
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3Context = () => {
  return useContext(Web3Context);
};
