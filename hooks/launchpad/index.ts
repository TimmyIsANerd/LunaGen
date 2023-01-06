/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/rules-of-hooks */
import { formatEther } from '@ethersproject/units';
import { useEffect, useMemo, useState } from 'react';
import chains from '../../assets/chains.json';
import { useWeb3Context } from '../../contexts/web3';
import rpcCall from '../../api/rpc';
import rq from '../subgraph-root';

export const usePublicTokenSalesList = (page: number = 1) => {
  const [items, setItems] = useState<Array<any>>([]);
  const { chainId } = useWeb3Context();

  useEffect(() => {
    rq(
      chainId,
      'vefi/public-token-sale',
      `
      {
        tokenSaleItems(first: 10, skip: ${(page - 1) * 10}) {
          maxContributionEther,
          minContributionEther,
          hardcap,
          softcap,
          id,
          tokensForSale,
          tokensPerEther,
          token,
          saleStartTime,
          saleEndTime
        }
      }
    `
    )
      .then((res) =>
        setItems(
          res.data.tokenSaleItems.map((item: any) => ({
            ...item,
            saleStartTime: parseInt(item.saleStartTime) * 1000,
            saleEndTime: parseInt(item.saleEndTime) * 1000
          }))
        )
      )
      .catch(console.log);
  }, [page]);
  return items;
};

export const fetchSaleItemInfo = (saleId: string, deps: any[] = []) => {
  const { chainId } = useWeb3Context();
  const chain = useMemo(() => chains[chainId as unknown as keyof typeof chains], [chainId]);
  const [info, setInfo] = useState({
    totalEtherRaised: '0'
  });

  useEffect(() => {
    if (!!saleId && chain) {
      (async () => {
        try {
          const val = await rpcCall(chain.rpcUrl, { method: 'eth_getBalance', params: [saleId, 'latest'] });
          setInfo({
            totalEtherRaised: formatEther(val)
          });
        } catch (error: any) {
          console.log(error);
        }
      })();
    }
  }, [saleId, chain, ...deps]);
  return info;
};
