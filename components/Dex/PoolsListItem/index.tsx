import React, { useState } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import { obtainLPDetailsFromPair } from '../../../hooks/dex';
import { useWeb3Context } from '../../../contexts/web3';
import { useAPIContext } from '../../../contexts/api';
import RemoveLiquidityModal from '../RemoveLiquidityModal';

export default function UserLPItem({ pair }: any) {
  const { chainId, account } = useWeb3Context();
  const { tokensListingAsDictionary } = useAPIContext();
  const lpDetails = obtainLPDetailsFromPair(pair, chainId || 97, account as string);
  const [removeLiquidityModalVisible, setRemoveLiquidityModalVisible] = useState<boolean>(false);

  return (
    <li className="w-full">
      <div className="flex justify-evenly items-center gap-2 w-full">
        <div className="avatar-group -space-x-6">
          <div className="avatar">
            <div className="w-4 md:w-8">
              <img
                src={
                  tokensListingAsDictionary[lpDetails.token0] ? tokensListingAsDictionary[lpDetails.token0].logoURI : '/images/placeholder_image.svg'
                }
                alt={lpDetails.token0}
              />
            </div>
          </div>
          <div className="avatar">
            <div className="w-4 md:w-8">
              <img
                src={
                  tokensListingAsDictionary[lpDetails.token1] ? tokensListingAsDictionary[lpDetails.token1].logoURI : '/images/placeholder_image.svg'
                }
                alt={lpDetails.token1}
              />
            </div>
          </div>
        </div>
        <span className="text-white font-poppins md:font-[16px] font-[12px]">
          {lpDetails.token0Symbol}/{lpDetails.token1Symbol}
        </span>
        <span className="text-white font-poppins md:font-[16px] font-[12px]">{lpDetails.accountBalance.toPrecision(2)}</span>
        <button onClick={() => setRemoveLiquidityModalVisible(true)} className="btn btn-square">
          {' '}
          <FiTrash2 className="text-white" />{' '}
        </button>
        <RemoveLiquidityModal
          token1Symbol={lpDetails.token0Symbol}
          token2Symbol={lpDetails.token1Symbol}
          token1Address={lpDetails.token0}
          token2Address={lpDetails.token1}
          liquidity={lpDetails.accountBalance}
          pair={pair}
          isVisible={removeLiquidityModalVisible}
          onClose={() => setRemoveLiquidityModalVisible(false)}
        />
      </div>
    </li>
  );
}
