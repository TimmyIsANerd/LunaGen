import { useEffect, useState } from 'react';
import { gql } from 'graphql-request';
import { floor, head } from 'lodash';
import { useGQLContext } from '../../contexts/graphql';
import { useWeb3Context } from '../../contexts/web3';
import { abi as stakingPoolABI } from '../../abi/StakingPool.json';
import { abi as erc20ABI } from 'vefi-token-launchpad-staking/artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';
import { useContract } from '../global';
import { Contract } from '@ethersproject/contracts';
import type { BigNumber } from '@ethersproject/bignumber';
import { formatEther, formatUnits } from '@ethersproject/units';
import { AddressZero } from '@ethersproject/constants';

const ALL_POOLS_QUERY = gql`
  query GetAllPools($skip: Int!) {
    stakingPools(first: 10, skip: $skip) {
      id
      apy
      endsIn
      blockNumber
      blockTimestamp
      stakedToken {
        id
        name
        symbol
      }
      rewardToken {
        id
        name
        symbol
      }
    }
  }
`;

const AVAILABLE_POOLS_QUERY = gql`
  query GetAllAvailablePools($skip: Int!) {
    stakingPools(first: 10, skip: $skip, where: { endsIn_gt: ${floor(Date.now() / 1000)}}) {
      id
      apy
      endsIn
      blockNumber
      blockTimestamp
      stakedToken {
        id
        name
        symbol
      }
      rewardToken {
        id
        name
        symbol
      }
    }
  }
`;

const SOLD_OUT_POOLS_QUERY = gql`
  query GetAllSoldOutPools($skip: Int!) {
    stakingPools(first: 10, skip: $skip, where: { endsIn_lte: ${floor(Date.now() / 1000)}}) {
      id
      apy
      endsIn
      blockNumber
      blockTimestamp
      stakedToken {
        id
        name
        symbol
      }
      rewardToken {
        id
        name
        symbol
      }
    }
  }
`;

const ACCOUNT_POOLS_QUERY = gql`
  query GetAccountPools($skip: Int!, $account: Bytes!) {
    stakingPools(first: 10, skip: $skip, where: { owner: $account }) {
      id
      apy
      endsIn
      blockNumber
      blockTimestamp
      stakedToken {
        id
        name
        symbol
      }
      rewardToken {
        id
        name
        symbol
      }
    }
  }
`;

const SINGLE_STAKING_POOL_QUERY = gql`
  query SingleStakingPool($id: ID!) {
    stakingPool(id: $id) {
      id
      apy
      tax
      owner
      endsIn
      blockNumber
      blockTimestamp
      totalStaked
      totalRewards
      stakedToken {
        id
        name
        symbol
      }
      rewardToken {
        id
        name
        symbol
      }
    }
  }
`;

const ACCOUNT_STAKES_QUERY = gql`
  query AccountStakes($account: Bytes) {
    stakes(where: { account: $account }) {
      id
      amount
      account
      blockTimestamp
      blockNumber
      pool {
        id
        apy
        tax
        owner
        endsIn
        blockNumber
        blockTimestamp
        totalStaked
        totalRewards
        stakedToken {
          id
          name
          symbol
        }
        rewardToken {
          id
          name
          symbol
        }
      }
    }
  }
`;

const SINGLE_STAKE_QUERY = gql`
  query SingleStake($id: ID!) {
    stake(id: $id) {
      id
      amount
      account
      blockTimestamp
      blockNumber
      pool {
        id
        apy
        tax
        owner
        endsIn
        blockNumber
        blockTimestamp
        totalStaked
        totalRewards
        stakedToken {
          id
          name
          symbol
        }
        rewardToken {
          id
          name
          symbol
        }
      }
    }
  }
`;

const STATS_QUERY = gql`
  {
    stakingPoolFactories {
      poolsCount
      stakesCount
    }
  }
`;

export const useAllPools = (page: number) => {
  const { poolsGQLClient } = useGQLContext();
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const req: any = await poolsGQLClient?.request(ALL_POOLS_QUERY, { skip: page * 10 });
        setData(req.stakingPools);
        setIsLoading(false);
      } catch (error: any) {
        console.error(error);
        setIsLoading(false);
        setError(new Error('Could not fetch'));
      }
    })();
  }, [page, poolsGQLClient]);

  return { isLoading, data, error };
};

export const useAvailablePools = (page: number) => {
  const { poolsGQLClient } = useGQLContext();
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const req: any = await poolsGQLClient?.request(AVAILABLE_POOLS_QUERY, { skip: page * 10 });
        setData(req.stakingPools);
        setIsLoading(false);
      } catch (error: any) {
        console.error(error);
        setIsLoading(false);
        setError(new Error('Could not fetch'));
      }
    })();
  }, [page, poolsGQLClient]);

  return { isLoading, data, error };
};

export const useSoldoutPools = (page: number) => {
  const { poolsGQLClient } = useGQLContext();
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const req: any = await poolsGQLClient?.request(SOLD_OUT_POOLS_QUERY, { skip: page * 10 });
        setData(req.stakingPools);
        setIsLoading(false);
      } catch (error: any) {
        console.error(error);
        setIsLoading(false);
        setError(new Error('Could not fetch'));
      }
    })();
  }, [page, poolsGQLClient]);

  return { isLoading, data, error };
};

export const useAllAccountPools = (page: number) => {
  const { poolsGQLClient } = useGQLContext();
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<any>(null);
  const { account } = useWeb3Context();

  useEffect(() => {
    if (account)
      (async () => {
        try {
          setIsLoading(true);
          const req: any = await poolsGQLClient?.request(ACCOUNT_POOLS_QUERY, { skip: page * 10, account });
          setData(req.stakingPools);
          setIsLoading(false);
        } catch (error: any) {
          console.error(error);
          setIsLoading(false);
          setError(new Error('Could not fetch'));
        }
      })();
    else setData([]);
  }, [account, page, poolsGQLClient]);

  return { isLoading, data, error };
};

export const useStakingPoolFactoriesStats = () => {
  const { poolsGQLClient } = useGQLContext();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const req: any = await poolsGQLClient?.request(STATS_QUERY);
        setData(head(req.stakingPoolFactories));
      } catch (error: any) {
        console.error(error);
      }
    })();
  }, [poolsGQLClient]);
  return data;
};

export const useSingleStakingPool = (id: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const { poolsGQLClient } = useGQLContext();

  useEffect(() => {
    if (id) {
      (async () => {
        try {
          setIsLoading(true);
          const req: any = await poolsGQLClient?.request(SINGLE_STAKING_POOL_QUERY, { id });
          setData(req.stakingPool);
          setIsLoading(false);
        } catch (error: any) {
          console.error(error);
          setIsLoading(false);
        }
      })();
    }
  }, [id, poolsGQLClient]);
  return { isLoading, data };
};

export const useAccountStakes = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const { poolsGQLClient } = useGQLContext();
  const { account } = useWeb3Context();

  useEffect(() => {
    if (account)
      (async () => {
        try {
          setIsLoading(true);
          const req: any = await poolsGQLClient?.request(ACCOUNT_STAKES_QUERY, { account });
          setData(req.stakes);
          setIsLoading(false);
        } catch (error: any) {
          console.error(error);
          setIsLoading(false);
        }
      })();
    else setData([]);
  }, [account, poolsGQLClient]);

  return { isLoading, data };
};

export const useSingleStake = (id: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const { poolsGQLClient } = useGQLContext();

  useEffect(() => {
    if (id)
      (async () => {
        try {
          setIsLoading(true);
          const req: any = await poolsGQLClient?.request(SINGLE_STAKE_QUERY, { id });
          setData(req.stake);
          setIsLoading(false);
        } catch (error: any) {
          console.error(error);
          setIsLoading(false);
        }
      })();
  }, [id, poolsGQLClient]);

  return { isLoading, data };
};

export const useAmountStakedMinusTax = (stakingPoolId: string, deps: any[] = []) => {
  const [amount, setAmount] = useState(0);
  const stakingContract = useContract(stakingPoolId, stakingPoolABI);
  const { account } = useWeb3Context();

  useEffect(() => {
    if (stakingContract && account) {
      (async () => {
        try {
          const tokenA: string = await stakingContract.tokenA();
          const amountStaked: BigNumber = await stakingContract.amountStaked(account);

          if (tokenA !== AddressZero) {
            const tokenContract = new Contract(tokenA, erc20ABI);
            const decimals = await tokenContract.decimals();
            setAmount(parseFloat(formatUnits(amountStaked, decimals)));
          } else setAmount(parseFloat(formatEther(amountStaked)));
        } catch (error: any) {
          console.error(error);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, stakingContract, ...deps]);
  return amount;
};

export const useStakeReward = (stakingPoolId: string) => {
  const [amount, setAmount] = useState(0);
  const stakingContract = useContract(stakingPoolId, stakingPoolABI);
  const { account } = useWeb3Context();

  useEffect(() => {
    if (stakingContract && account) {
      (async () => {
        try {
          const rewardToken: string = await stakingContract.rewardToken();
          const reward: BigNumber = await stakingContract.calculateReward(account);

          if (rewardToken !== AddressZero) {
            const tokenContract = new Contract(rewardToken, erc20ABI);
            const decimals = await tokenContract.decimals();
            setAmount(parseFloat(formatUnits(reward, decimals)));
          } else setAmount(parseFloat(formatEther(reward)));
        } catch (error: any) {
          console.error(error);
        }
      })();
    }
  }, [account, stakingContract]);
  return amount;
};

export const useNextWithdrawalTime = (stakingPoolId: string, deps: any[] = []) => {
  const [timestamp, setTimestamp] = useState(0);
  const { account } = useWeb3Context();
  const stakingContract = useContract(stakingPoolId, stakingPoolABI);

  useEffect(() => {
    if (stakingContract && account) {
      (async () => {
        try {
          const time: BigNumber = await stakingContract.nextWithdrawalTime(account);
          setTimestamp(parseInt(time.toHexString()));
        } catch (error: any) {
          console.error(error);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, stakingContract, ...deps]);
  return timestamp;
};
