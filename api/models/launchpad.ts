export interface TokenSaleItemModel {
  id: string;
  token: string;
  tokensForSale: string;
  hardCap: string;
  softCap: string;
  presaleRate: string;
  minContribution: string;
  maxContribution: string;
  startTime: string;
  proceedsTo: string;
  endTime: string;
  admin: string;
  chainId: string;
  createdAt?: any;
  updatedAt?: any;
  rank: 'gold' | 'silver' | 'bronze' | 'unknown';
  details?: {
    description?: string;
    urls?: {
      website?: string;
      telegram?: string;
      discord?: string;
      twitter?: string;
    };
    tokenomics?: { [key: string]: number };
  };
  vestingSchedule?: {
    [key: string]: string;
  };
}
