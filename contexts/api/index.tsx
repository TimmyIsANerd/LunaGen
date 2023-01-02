/* eslint-disable react-hooks/exhaustive-deps */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import _ from 'lodash';
import { EventModel, ListingModel } from '../../api/models/dex';
import { useWeb3Context } from '../web3';
import { fetchEvents, fetchLiquidityPoolsForUser, fetchListing } from '../../api/dex';
import { convertListingToDictionary } from '../../api/models/utils';
import { fetchAccountStakes, fetchAccountStakingPools, fetchStakingPools, fetchSpecialStakingPools } from '../../api/staking';
import { StakeEventModel } from '../../api/models/staking';
import { fetchAllMultiSigWalletsOfAccount } from '../../api/multisig';
import { TokenSaleItemModel } from '../../api/models/launchpad';
import { fetchAllPublicSaleItems, fetchAllPrivateSaleItems } from '../../api/launchpad';

type APIContextType = {
  tokensListing: Array<ListingModel>;
  stakingPools: {
    items: Array<string>;
    totalItems: number;
  };
  specialStakingPools: {
    items: Array<string>;
    totalItems: number;
  };
  accountStakingPools: {
    totalItems: number;
    items: Array<string>;
  };
  tokensListingAsDictionary: { [key: string]: ListingModel };
  liquidityPoolsForUser: {
    totalItems: number;
    items: Array<string>;
  };
  importedPools: { [chainId: number]: Array<string> };
  stakesByAccount: {
    totalItems: number;
    items: Array<StakeEventModel>;
  };
  multiSigsByAccount: {
    totalItems: number;
    items: Array<string>;
  };
  publicSaleItems: {
    totalItems: number;
    items: Array<TokenSaleItemModel>;
  };
  privateSaleItems: {
    totalItems: number;
    items: Array<TokenSaleItemModel>;
  };
  importedMultiSigs: { [chainId: number]: Array<string> };
  importMultiSigs: (addresses: Array<string>) => void;
  topPairs: Array<string>;
  importToken: (model: ListingModel) => void;
  importPool: (pool: string) => void;
  events: {
    type: 'all' | 'swap' | 'burn' | 'mint';
    totalItems: number;
    items: Array<EventModel>;
  };
  eventsDataUpdate: (page: number, type: 'all' | 'swap' | 'burn' | 'mint') => void;
  fetchPools: (page: number) => void;
  fetchAccountPools: (page: number) => void;
  fetchStakesByAccount: (page: number) => void;
  fetchMultiSigsByAccount: (page: number) => void;
  fetchSpecialPools: (page: number) => void;
  fetchPublicTokenSaleItems: (page: number) => void;
  fetchPrivateTokenSaleItems: (page: number) => void;
};

const APIContext = createContext({} as APIContextType);

export const APIContextProvider = ({ children }: any) => {
  const { chainId, active, account } = useWeb3Context();
  const [tokensListing, setTokensListing] = useState<Array<ListingModel>>([]);
  const [stakingPools, setStakingPools] = useState<{
    totalItems: number;
    items: Array<string>;
  }>({ totalItems: 0, items: [] });
  const [accountStakingPools, setAccountStakingPools] = useState<{
    totalItems: number;
    items: Array<string>;
  }>({
    totalItems: 0,
    items: []
  });
  const [tokensListingAsDictionary, setTokensListingAsDictionary] = useState<{ [key: string]: ListingModel }>({});
  const [stakesByAccount, setStakesByAccount] = useState<{
    totalItems: number;
    items: Array<StakeEventModel>;
  }>({
    totalItems: 0,
    items: []
  });
  const [liquidityPoolsForUser, setLiquidityPoolsForUser] = useState<{
    totalItems: number;
    items: Array<string>;
  }>({ totalItems: 0, items: [] });
  const [multiSigsByAccount, setMultiSigsByAccount] = useState<{
    totalItems: number;
    items: Array<string>;
  }>({ totalItems: 0, items: [] });
  const [topPairs, setTopPairs] = useState<Array<string>>([]);
  const [events, setEvents] = useState<{
    type: 'all' | 'swap' | 'burn' | 'mint';
    totalItems: number;
    items: Array<EventModel>;
  }>({ type: 'all', totalItems: 0, items: [] });
  const [importedPools, setImportedPools] = useState<{ [chainId: number]: Array<string> }>({ 97: [] });
  const [importedMultiSigs, setImportedMultiSigs] = useState<{ [chainId: number]: Array<string> }>({ 97: [] });
  const [specialStakingPools, setSpecialStakingPools] = useState<{ totalItems: number; items: Array<string> }>({
    totalItems: 0,
    items: []
  });
  const [publicSaleItems, setPublicSaleItems] = useState<{ totalItems: number; items: Array<TokenSaleItemModel> }>({
    totalItems: 0,
    items: []
  });
  const [privateSaleItems, setPrivateSaleItems] = useState<{ totalItems: number; items: Array<TokenSaleItemModel> }>({
    totalItems: 0,
    items: []
  });

  const importToken = useCallback((model: ListingModel) => {
    if (!_.includes(tokensListing, model)) setTokensListing((models) => [...models, model]);
  }, []);

  const eventsDataUpdate = useCallback(
    (page: number, t: 'all' | 'swap' | 'burn' | 'mint') => {
      fetchEvents(chainId || 97, page, t === 'all' ? undefined : t).then((val) =>
        setEvents({
          type: t,
          totalItems: val.totalItems,
          items: val.items
        })
      );
    },
    [chainId]
  );

  const importPool = useCallback(
    (pool: string) => {
      if (!!chainId) {
        if (!_.includes(liquidityPoolsForUser.items, pool) && !_.includes(importedPools[chainId as number], pool))
          setImportedPools((pools) => ({ ...pools, [chainId as number]: [...(pools[chainId as number] || []), pool] }));
      }
    },
    [chainId]
  );

  const importMultiSigs = useCallback(
    (addresses: Array<string>) => {
      if (!!chainId) {
        if (!_.every(addresses, (addr) => _.includes(importedMultiSigs[chainId as number], addr))) {
          setImportedMultiSigs((multisigs) => ({ ...multisigs, [chainId as number]: addresses }));
        }
      }
    },
    [chainId]
  );

  const fetchPools = useCallback(
    (page: number = 1) => {
      fetchStakingPools(chainId || 97, page)
        .then(setStakingPools)
        .catch(console.log);
    },
    [chainId]
  );

  const fetchSpecialPools = useCallback(
    (page: number) => {
      fetchSpecialStakingPools(chainId || 97, page)
        .then(setSpecialStakingPools)
        .catch(console.log);
    },
    [chainId]
  );

  const fetchMultiSigsByAccount = useCallback(
    (page: number = 1) => {
      fetchAllMultiSigWalletsOfAccount(chainId || 97, account as string, page)
        .then(setMultiSigsByAccount)
        .catch(console.log);
    },
    [chainId, account]
  );

  const fetchAccountPools = useCallback(
    (page: number = 1) => {
      fetchAccountStakingPools(chainId || 97, account as string, page)
        .then(setAccountStakingPools)
        .catch(console.log);
    },
    [chainId, account]
  );

  const fetchStakesByAccount = useCallback(
    (page: number = 1) => {
      fetchAccountStakes(chainId || 97, account as string, page)
        .then(setStakesByAccount)
        .catch(console.log);
    },
    [chainId, account]
  );

  const fetchPublicTokenSaleItems = useCallback(
    (page: number = 1) => {
      fetchAllPublicSaleItems(chainId || 97, page)
        .then(setPublicSaleItems)
        .catch(console.log);
    },
    [chainId]
  );

  const fetchPrivateTokenSaleItems = useCallback(
    (page: number = 1) => {
      fetchAllPrivateSaleItems(chainId || 97, page)
        .then(setPrivateSaleItems)
        .catch(console.log);
    },
    [chainId]
  );

  useEffect(() => {
    const iPools = localStorage.getItem('vefi-dapps-dex-imported-pools');
    const iMultisigs = localStorage.getItem('vefi-dapps-multisig-imported-wallets');

    if (typeof iPools === 'string' || !!iPools) {
      setImportedPools(JSON.parse(iPools));
    }

    if (typeof iMultisigs === 'string' || !!iMultisigs) {
      setImportedMultiSigs(JSON.parse(iMultisigs));
    }
  }, []);

  useEffect(() => {
    (async () => {
      if (!!account && !!chainId) {
        const listing = await fetchListing(chainId || 1);

        setTokensListing(listing);
        fetchPools(1);
        fetchAccountPools(1);
        fetchStakesByAccount(1);
        fetchMultiSigsByAccount(1);
      }
    })();
  }, [chainId, account]);

  useEffect(() => {
    if (tokensListing.length > 0) {
      setTokensListingAsDictionary(convertListingToDictionary(tokensListing));
    }
  }, [tokensListing]);

  useEffect(() => {
    if (importedPools) {
      localStorage.setItem('vefi-dapps-dex-imported-pools', JSON.stringify(importedPools));
    }
  }, [importedPools]);

  useEffect(() => {
    if (importedMultiSigs) {
      localStorage.setItem('vefi-dapps-multisig-imported-wallets', JSON.stringify(importedMultiSigs));
    }
  }, [importedMultiSigs]);

  useEffect(() => {
    if (!!chainId) setImportedPools([]);
  }, [chainId]);

  useEffect(() => {
    if (active && !!account) {
      fetchLiquidityPoolsForUser(chainId || 97, account)
        .then(setLiquidityPoolsForUser)
        .catch(console.log);
    }
  }, [active, chainId, account]);

  return (
    <APIContext.Provider
      value={{
        tokensListing,
        tokensListingAsDictionary,
        liquidityPoolsForUser,
        importToken,
        importPool,
        importedPools,
        topPairs,
        eventsDataUpdate,
        events,
        stakingPools,
        fetchPools,
        accountStakingPools,
        fetchAccountPools,
        stakesByAccount,
        fetchStakesByAccount,
        multiSigsByAccount,
        fetchMultiSigsByAccount,
        importedMultiSigs,
        importMultiSigs,
        specialStakingPools,
        fetchSpecialPools,
        publicSaleItems,
        privateSaleItems,
        fetchPrivateTokenSaleItems,
        fetchPublicTokenSaleItems
      }}
    >
      {children}
    </APIContext.Provider>
  );
};

export const useAPIContext = () => useContext(APIContext);
