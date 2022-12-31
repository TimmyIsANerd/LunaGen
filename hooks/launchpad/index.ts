/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/rules-of-hooks */
import { formatEther } from '@ethersproject/units';
import { useEffect, useMemo, useState } from 'react';
import chains from '../../assets/chains.json';
import { useWeb3Context } from '../../contexts/web3';
import rpcCall from '../../api/rpc';

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
