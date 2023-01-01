import React, { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Countdown from 'react-countdown';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Chart } from 'react-google-charts';
import { Interface } from '@ethersproject/abi';
import { isAddress } from '@ethersproject/address';
import { Contract } from '@ethersproject/contracts';
import { AddressZero } from '@ethersproject/constants';
import { Web3Provider } from '@ethersproject/providers';
import { formatEther, formatUnits, parseEther, parseUnits } from '@ethersproject/units';
import { Fetcher, Token } from 'quasar-sdk-core';
import _ from 'lodash';
import { FiPlus, FiChevronDown, FiArrowLeft, FiArrowRight, FiGlobe, FiTwitter, FiCopy, FiMinus } from 'react-icons/fi';
import { FaDiscord, FaTelegram } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import { ThreeDots } from 'react-loader-spinner';
import { abi as saleCreatorAbi } from 'vefi-token-launchpad-staking/artifacts/contracts/PublicTokenSaleCreator.sol/PublicTokenSaleCreator.json';
import { abi as saleAbi } from 'vefi-token-launchpad-staking/artifacts/contracts/interfaces/ITokenSale.sol/ITokenSale.json';
import { abi as erc20Abi } from 'vefi-token-launchpad-staking/artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';
import millify from 'millify';
import { TokenSaleItemCard } from '../../components/LaunchPad';
import { useWeb3Context } from '../../contexts/web3';
import chains from '../../assets/chains.json';
import tokenSaleCreators from '../../assets/token_sales_creators.json';
import { useAPIContext } from '../../contexts/api';
import rpcCall from '../../api/rpc';
import { TokenSaleItemModel } from '../../api/models/launchpad';
import { fetchSaleItemInfo } from '../../hooks/launchpad';
import { fetchTokenBalanceForConnectedWallet } from '../../hooks/dex';

enum Subroutes {
  ALL_ITEMS,
  SINGLE_ITEM,
  CREATE_NEW
}

const AllSalesRoute = ({ onClick, rank = 'all' }: any) => {
  const { publicSaleItems, fetchPublicTokenSaleItems } = useAPIContext();
  const [page, setPage] = useState<number>(1);

  useEffect(() => fetchPublicTokenSaleItems(page), [fetchPublicTokenSaleItems, page]);
  return (
    <div className="flex flex-col justify-center items-center gap-3">
      <div className="flex flex-col md:flex-row justify-center items-center gap-2 flex-wrap">
        {_.map(
          publicSaleItems.items.filter((model) => (rank === 'all' ? !!model : model.rank === rank)),
          (data, index) => (
            <TokenSaleItemCard key={index} data={data} onClick={(val) => onClick(val)} />
          )
        )}
      </div>
      <div className="flex justify-center items-center gap-2 text-white/70">
        <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} className="bg-transparent">
          <FiArrowLeft />
        </button>
        <span>
          Page {page} of {Math.ceil(publicSaleItems.totalItems / 20)}
        </span>
        <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(publicSaleItems.totalItems / 20)} className="bg-transparent">
          <FiArrowRight />
        </button>
      </div>
    </div>
  );
};

const SelectedSaleItemRoute = ({
  startTime,
  token,
  details,
  rank,
  id,
  hardCap,
  softCap,
  endTime,
  tokensForSale,
  minContribution,
  maxContribution,
  presaleRate
}: TokenSaleItemModel) => {
  const { tokensListingAsDictionary } = useAPIContext();
  const { chainId, library, account } = useWeb3Context();
  const chain = useMemo(() => chains[chainId as unknown as keyof typeof chains], [chainId]);
  const [tk, setToken] = useState<Token>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEmergencyWithdrawalLoading, setIsEmergencyWithdrawalLoading] = useState<boolean>(false);
  const [isNormalWithdrawalLoading, setIsNormalWithdrawalLoading] = useState<boolean>(false);
  const [isFinalizeSaleLoading, setIsFinalizeSaleLoading] = useState<boolean>(false);
  const [totalSupply, setTotalSupply] = useState<string>('0');
  const { totalEtherRaised } = fetchSaleItemInfo(id, [isLoading, isEmergencyWithdrawalLoading]);
  const [amountContributed, setAmountContributed] = useState<string>('0');
  const [expectedBalance, setExpectedBalance] = useState<string>('0');
  const [buyAmount, setBuyAmount] = useState<number>(0);
  const ethBalance = fetchTokenBalanceForConnectedWallet(AddressZero, [isLoading, isEmergencyWithdrawalLoading, isNormalWithdrawalLoading]);

  const buyTokens = useCallback(async () => {
    try {
      setIsLoading(true);
      const provider = new Web3Provider(library?.givenProvider);
      const saleContract = new Contract(id, saleAbi, provider.getSigner());
      const contributionTx = await saleContract.contribute({ value: parseEther(buyAmount.toPrecision(4)).toHexString() });
      await contributionTx.wait();
      toast(`Contributed ${buyAmount} ${chain?.symbol}`, { type: 'success' });
      setIsLoading(false);
    } catch (error: any) {
      setIsLoading(false);
      toast(error.message, { type: 'error' });
    }
  }, [buyAmount, chain?.symbol, id, library?.givenProvider]);

  const emergencyWithdrawal = useCallback(async () => {
    try {
      setIsEmergencyWithdrawalLoading(true);
      const provider = new Web3Provider(library?.givenProvider);
      const saleContract = new Contract(id, saleAbi, provider.getSigner());
      const withdrawalTx = await saleContract.emergencyWithdraw();
      await withdrawalTx.wait();
      toast('Successfully withdrawn', { type: 'success' });
      setIsEmergencyWithdrawalLoading(false);
    } catch (error: any) {
      setIsEmergencyWithdrawalLoading(false);
      toast(error.message, { type: 'error' });
    }
  }, [id, library?.givenProvider]);

  const normalWithdrawal = useCallback(async () => {
    try {
      setIsNormalWithdrawalLoading(true);
      const provider = new Web3Provider(library?.givenProvider);
      const saleContract = new Contract(id, saleAbi, provider.getSigner());
      const withdrawalTx = await saleContract.withdraw();
      await withdrawalTx.wait();
      toast('Successfully withdrawn', { type: 'success' });
      setIsNormalWithdrawalLoading(false);
    } catch (error: any) {
      console.log(error);
      setIsNormalWithdrawalLoading(false);
      toast(error.message, { type: 'error' });
    }
  }, [id, library?.givenProvider]);

  const finalizeTokenSale = useCallback(async () => {
    try {
      setIsFinalizeSaleLoading(true);
      const provider = new Web3Provider(library?.givenProvider);
      const saleContract = new Contract(id, saleAbi, provider.getSigner());
      const finalizeTx = await saleContract.finalizeSale();
      await finalizeTx.wait();
      toast('Sale finalized', { type: 'success' });
      setIsFinalizeSaleLoading(false);
    } catch (error: any) {
      setIsFinalizeSaleLoading(false);
      toast(error.message, { type: 'error' });
    }
  }, [id, library?.givenProvider]);

  useEffect(() => {
    if (!!token && !!chain && !!chainId) {
      (async () => {
        try {
          const t = await Fetcher.fetchTokenData(chainId || 97, token, chain?.rpcUrl);
          const erc20Interface = new Interface(erc20Abi);
          const totalSupplyHash = erc20Interface.getSighash('totalSupply()');
          const totalSupplyCall = await rpcCall(chain.rpcUrl, { method: 'eth_call', params: [{ to: token, data: totalSupplyHash }, 'latest'] });
          setToken(t);
          setTotalSupply(formatUnits(totalSupplyCall, t.decimals));
        } catch (error: any) {
          console.log(error);
        }
      })();
    }
  }, [chain, chainId, token]);

  useEffect(() => {
    if (!!account && !!id && !!tk) {
      (async () => {
        try {
          const saleAbiInterface = new Interface(saleAbi);
          const data = saleAbiInterface.encodeFunctionData('amountContributed(address)', [account]);
          const amount = await rpcCall(chain.rpcUrl, { method: 'eth_call', params: [{ to: id, data }, 'latest'] });
          const data2 = saleAbiInterface.encodeFunctionData('balances(address)', [account]);
          const bal = await rpcCall(chain.rpcUrl, { method: 'eth_call', params: [{ to: id, data: data2 }, 'latest'] });
          setAmountContributed(formatEther(amount));
          setExpectedBalance(formatUnits(bal, tk?.decimals));
        } catch (error: any) {
          console.log(error);
        }
      })();
    }
  }, [account, chain.rpcUrl, id, tk, tk?.decimals, isLoading, isEmergencyWithdrawalLoading, isNormalWithdrawalLoading]);

  return (
    <div className="flex flex-col md:flex-row justify-evenly items-start gap-6">
      <div className="flex flex-col gap-8 justify-center items-center flex-1 h-full w-full">
        <div className="flex flex-col bg-[#161525] rounded-[31px] w-full gap-4">
          <div className="w-full bg-[url('/images/bg_sale_item.png')] bg-cover rounded-t-[inherit]">
            <div className="flex justify-between items-end w-full gap-3 relative bottom-[-30px] px-2">
              <div className="flex justify-center items-center gap-4">
                <div className="avatar">
                  <div className="w-20 rounded-full">
                    <img
                      src={
                        tokensListingAsDictionary[token.toLowerCase()]
                          ? tokensListingAsDictionary[token.toLowerCase()].logoURI
                          : '/images/placeholder_image.svg'
                      }
                      alt={token}
                    />
                  </div>
                </div>
                {details?.urls && (
                  <div className="flex justify-center items-center gap-2 text-[#fff] text-[25px] relative bottom-[-25px]">
                    {details.urls.website && (
                      <a href={details.urls.website} target="_blank" rel="noreferrer">
                        <FiGlobe />
                      </a>
                    )}
                    {details.urls.telegram && (
                      <a href={details.urls.telegram} target="_blank" rel="noreferrer">
                        <FaTelegram />
                      </a>
                    )}
                    {details.urls.discord && (
                      <a href={details.urls.discord} target="_blank" rel="noreferrer">
                        <FaDiscord />
                      </a>
                    )}
                    {details.urls.twitter && (
                      <a href={details.urls.twitter} target="_blank" rel="noreferrer">
                        <FiTwitter />
                      </a>
                    )}
                  </div>
                )}
              </div>
              <span
                className={`flex items-center ${
                  rank !== 'unknown' ? (rank === 'gold' ? 'bg-[#d4af37]' : rank === 'silver' ? 'bg-[#bcc6cc]' : 'bg-[#cd7f32]') : 'bg-[#666362]'
                } text-white text-[10px] font-[600] rounded p-1`}
              >
                {rank}
              </span>
            </div>
          </div>
          <div className="flex flex-col w-full gap-3 justify-center items-center py-4">
            <h4 className="font-[700] text-white/10 text-[22px] md:text-[37px] font-MontserratAlt">Project Description</h4>
            {details?.description ? (
              <>
                {_.map(details.description.split('\n'), (str, index) => (
                  <p key={index} className="text-white font-Inter font-[500] text-[16px] w-full text-center">
                    {str}
                  </p>
                ))}
              </>
            ) : (
              <span className="font-Montserrat font-[600] text-red-500 uppercase text-[28px] md:text-[40px]">No Description</span>
            )}
          </div>
          <div className="flex flex-col justify-center items-center gap-2 w-full px-4 py-10">
            <div className="flex justify-between items-center w-full border-b border-b-[#fff]/20 px-1 py-1 text-ellipsis">
              <span className="font-Inter text-white font-[500] text-[16px]">Presale ID</span>
              <div className="flex flex-col justify-end items-end gap-1 px-1">
                <p className="text-[#197fcb] break-all text-[12px] font-[500] font-Montserrat w-full">{id}</p>
                <p className="text-white font-Inter font-[500] text-[9px] text-center">Do not send funds directly to this ID</p>
              </div>
            </div>
            {!!tk && (
              <>
                <div className="flex justify-between items-center w-full border-b border-b-[#fff]/20 px-1 py-1 text-ellipsis">
                  <span className="font-Inter text-white font-[500] text-[16px]">Token Name</span>
                  <div className="flex flex-col justify-center items-center gap-1 px-1">
                    <p className="text-white font-Inter font-[500] text-[16px] text-center">{tk.name}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center w-full border-b border-b-[#fff]/20 px-1 py-1 text-ellipsis">
                  <span className="font-Inter text-white font-[500] text-[16px]">Token Symbol</span>
                  <div className="flex flex-col justify-center items-center gap-1 px-1">
                    <p className="text-white font-Inter font-[500] text-[16px] text-center">{tk.symbol}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center w-full border-b border-b-[#fff]/20 px-1 py-1 text-ellipsis">
                  <span className="font-Inter text-white font-[500] text-[16px]">Total Supply</span>
                  <div className="flex flex-col justify-center items-center gap-1 px-1">
                    <p className="text-white font-Inter font-[500] text-[16px] text-center">{totalSupply}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center w-full border-b border-b-[#fff]/20 px-1 py-1 text-ellipsis">
                  <span className="font-Inter text-white font-[500] text-[16px]">Tokens For Presale</span>
                  <div className="flex flex-col justify-center items-center gap-1 px-1">
                    <p className="text-white font-Inter font-[500] text-[16px] text-center">
                      {formatUnits(Number(tokensForSale).toLocaleString('fullwide', { useGrouping: false }), tk.decimals)}
                    </p>
                  </div>
                </div>
              </>
            )}
            <div className="flex justify-between items-center w-full border-b border-b-[#fff]/20 px-1 py-1 text-ellipsis">
              <span className="font-Inter text-white font-[500] text-[16px]">Soft Cap</span>
              <div className="flex flex-col justify-center items-center gap-1 px-1">
                <p className="text-white font-Inter font-[500] text-[16px] text-center">
                  {formatEther(Number(softCap).toLocaleString('fullwide', { useGrouping: false }))} {chain?.symbol}
                </p>
              </div>
            </div>
            <div className="flex justify-between items-center w-full border-b border-b-[#fff]/20 px-1 py-1 text-ellipsis">
              <span className="font-Inter text-white font-[500] text-[16px]">Hard Cap</span>
              <div className="flex flex-col justify-center items-center gap-1 px-1">
                <p className="text-white font-Inter font-[500] text-[16px] text-center">
                  {formatEther(Number(hardCap).toLocaleString('fullwide', { useGrouping: false }))} {chain?.symbol}
                </p>
              </div>
            </div>
            <div className="flex justify-between items-center w-full border-b border-b-[#fff]/20 px-1 py-1 text-ellipsis">
              <span className="font-Inter text-white font-[500] text-[16px]">Presale Start Time</span>
              <div className="flex flex-col justify-center items-center gap-1 px-1">
                <p className="text-white font-Inter font-[500] text-[16px] text-center">{new Date(parseInt(startTime)).toUTCString()}</p>
              </div>
            </div>
            <div className="flex justify-between items-center w-full border-b border-b-[#fff]/20 px-1 py-1 text-ellipsis">
              <span className="font-Inter text-white font-[500] text-[16px]">Presale End Time</span>
              <div className="flex flex-col justify-center items-center gap-1 px-1">
                <p className="text-white font-Inter font-[500] text-[16px] text-center">{new Date(parseInt(endTime)).toUTCString()}</p>
              </div>
            </div>
          </div>
          <div className="flex justify-center items-center w-full py-3 px-3">
            <p className="w-full text-center font-MontserratAlt font-[30px] text-white uppercase">
              Reach out to us via any of our social handles if you&apos;re the owner of this token sale item and want to update your presale
              information
            </p>
          </div>
        </div>
        {details?.tokenomics && (
          <div className="flex flex-col justify-center items-center bg-[#161215] rounded-[31px] gap-4 px-8 py-3 w-full">
            <div className="border-b border-b-[#fff]/25 py-4 w-full flex justify-center items-center">
              <span className="text-[#fff] font-MontserratAlt font-[700] text-[25px]">Tokenomics</span>
            </div>
            <Chart
              chartType="PieChart"
              data={[['Item', 'Value'], ..._.keys(details.tokenomics).map((key) => [key.toUpperCase(), details?.tokenomics?.[key]])]}
              options={{ backgroundColor: 'transparent', is3D: true, legend: { textStyle: { color: '#fff', fontName: 'Montserrat' } } }}
              width={'100%'}
            />
          </div>
        )}
        {details?.vestingSchedule && Object.keys(details.vestingSchedule).length > 0 && (
          <div className="flex flex-col justify-center items-center bg-[#161215] rounded-[31px] gap-4 px-8 py-3 w-full">
            <div className="border-b border-b-[#fff]/25 py-4 w-full flex justify-center items-center">
              <span className="text-[#fff] font-MontserratAlt font-[700] text-[25px]">Vesting Schedule</span>
            </div>
            <div className="flex flex-col justify-center items-center gap-2 px-8 py-3 w-full">
              {_.map(Object.keys(details.vestingSchedule), (key, index) => (
                <div key={index} className="flex justify-between items-center w-full border-b border-b-[#fff]/20 px-1 py-1 text-ellipsis">
                  <span className="font-Inter text-white font-[500] text-[16px]">{key}</span>
                  <div className="flex flex-col justify-center items-center gap-1 px-1">
                    <p className="text-white font-Inter font-[500] text-[16px] text-center">{details?.vestingSchedule![key] as string}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-8 justify-center items-center h-full">
        <div className="flex flex-col bg-[#161215] rounded-[15px] gap-3 px-6 py-2">
          <div className="flex flex-col gap-3 w-full justify-center items-center">
            <span className="text-[whitesmoke] text-[14px] font-Montserrat font-semibold">Sale Starts In:</span>
            <Countdown
              date={parseInt(startTime)}
              renderer={({ days, hours, minutes, seconds, completed }) => (
                <>
                  {completed ? (
                    <span className="font-Montserrat text-white font-[700] uppercase">Started</span>
                  ) : (
                    <span className="font-Montserrat text-white font-[700] text-[16px]">
                      {days} Day(s) : {hours} Hr(s) : {minutes} Min(s) : {seconds} Sec(s)
                    </span>
                  )}
                </>
              )}
            />
            <div className="flex flex-col gap-1 w-full justify-center items-center">
              <div className="h-[8px] bg-[#1673B9] w-full">
                <div
                  className="h-full bg-green-400"
                  style={{
                    width: `${
                      _.multiply(parseInt(totalEtherRaised), 100) / Number(hardCap) > 100
                        ? 100
                        : _.multiply(parseInt(totalEtherRaised), 100) / Number(hardCap)
                    }%`
                  }}
                />
              </div>
              <div className="flex justify-between text-center pt-[0.099rem] w-full">
                <span className="text-[#fff] font-bold font-Montserrat">0</span>
                <span className="text-[#fff] font-bold font-Montserrat">
                  {millify(parseFloat(formatEther(Number(hardCap).toLocaleString('fullwide', { useGrouping: false }))), { precision: 4 })}
                </span>
              </div>
            </div>
            <div className="flex flex-col justify-center items-center gap-2 w-full border-b border-b-[#fff]/20 py-4">
              <span className="text-[#fff] font-[600] font-MontserratAlt">Contribute</span>
              <div className="w-full flex md:flex-row justify-center items-center gap-2">
                <div className="bg-[#282736] rounded-[15px] gap-2 px-1 py-1 flex-1 flex justify-between items-center w-1/2">
                  <input
                    type="number"
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(e.target.valueAsNumber || 0)}
                    className="p-[2px] bg-transparent text-white border-0 w-full outline-0 appearance-none font-[700] text-[18px] font-MontserratAlt"
                  />
                  <button
                    onClick={() => setBuyAmount(parseFloat(ethBalance))}
                    className="text-[#1673b9] font-MontserratAlt text-[12px] bg-transparent px-1 py-1"
                  >
                    Max
                  </button>
                </div>
                <button
                  disabled={isLoading || buyAmount <= 0}
                  onClick={buyTokens}
                  className="bg-[#282736] rounded-[15px] gap-2 px-6 py-2 text-[#ffeb82] font-MontserratAlt flex-1 flex justify-center items-center"
                >
                  Buy <ThreeDots visible={isLoading} height={20} width={20} />
                </button>
              </div>
            </div>
            <div className="flex flex-col w-full gap-3 justify-center items-center">
              <span className="font-Montserrat text-white text-[12px] font-[600]">Your Contribution:</span>
              <span className="font-Montserrat text-[#289bf1] text-[12px] font-[700]">
                {amountContributed} {chain?.symbol}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center w-full border-b border-b-[#fff]/20 px-1 py-1 text-ellipsis">
            <span className="font-Inter text-white font-[500] text-[16px]">Minimum Buy</span>
            <div className="flex flex-col justify-center items-center gap-1 px-1">
              <p className="text-white font-Inter font-[500] text-[16px] text-center">
                {formatEther(Number(minContribution).toLocaleString('fullwide', { useGrouping: false }))} {chain?.symbol}
              </p>
            </div>
          </div>
          <div className="flex justify-between items-center w-full border-b border-b-[#fff]/20 px-1 py-1 text-ellipsis">
            <span className="font-Inter text-white font-[500] text-[16px]">Maximum Buy</span>
            <div className="flex flex-col justify-center items-center gap-1 px-1">
              <p className="text-white font-Inter font-[500] text-[16px] text-center">
                {formatEther(Number(maxContribution).toLocaleString('fullwide', { useGrouping: false }))} {chain?.symbol}
              </p>
            </div>
          </div>
          {!!tk && (
            <div className="flex justify-between items-center w-full border-b border-b-[#fff]/20 px-1 py-1 text-ellipsis">
              <span className="font-Inter text-white font-[500] text-[16px]">Rate</span>
              <div className="flex flex-col justify-center items-center gap-1 px-1">
                <p className="text-white font-Inter font-[500] text-[16px] text-center">
                  1 {chain?.symbol} {'<=>'} {formatUnits(Number(presaleRate).toLocaleString('fullwide', { useGrouping: false }), tk.decimals)}{' '}
                  {tk.symbol}
                </p>
              </div>
            </div>
          )}
          <div className="flex justify-between items-center w-full border-b border-b-[#fff]/20 px-1 py-1 text-ellipsis">
            <span className="font-Inter text-white font-[500] text-[16px]">Your Balance</span>
            <div className="flex flex-col justify-center items-center gap-1 px-1">
              <p className="text-white font-Inter font-[500] text-[16px] text-center">
                {expectedBalance} {tk?.symbol}
              </p>
            </div>
          </div>
          <div className="flex justify-center items-center w-full gap-3 py-4">
            <button
              onClick={normalWithdrawal}
              disabled={isNormalWithdrawalLoading}
              className={`btn btn-success flex-1 px-1 py-1 ${isNormalWithdrawalLoading ? 'loading' : ''}`}
            >
              Harvest Tokens
            </button>
            <button
              onClick={emergencyWithdrawal}
              disabled={isEmergencyWithdrawalLoading}
              className={`btn btn-warning flex-1 px-1 py-1 ${isEmergencyWithdrawalLoading ? 'loading' : ''}`}
            >
              Emergency Withdrawal
            </button>
          </div>
        </div>
        <div className="bg-[#161215] flex flex-col justify-center items-center gap-3 rounded-[15px] px-4 py-3 w-full flex-1">
          <div className="flex flex-col w-full justify-center items-center gap-1 font-Montserrat">
            <span className="text-[#ffeb82] font-[600] text-[11px]">Token Address:</span>
            <div className="flex justify-center gap-2 items-center">
              <span className="text-white text-[11px]">{token}</span>
              <CopyToClipboard text={token}>
                <button className="btn btn-ghost btn-square btn-sm">
                  <FiCopy className="text-white" />
                </button>
              </CopyToClipboard>
            </div>
          </div>
          <button
            disabled={isFinalizeSaleLoading}
            onClick={finalizeTokenSale}
            className={`btn btn-accent w-full gap-3 ${isFinalizeSaleLoading ? 'loading' : ''}`}
          >
            Finalize Sale
            <div className="badge badge-secondary">admin</div>
          </button>
        </div>
      </div>
      <ToastContainer position="top-right" theme="dark" autoClose={5000} />
    </div>
  );
};

const CreateSaleRoute = () => {
  const { chainId, library } = useWeb3Context();
  const [hasVesting, setHasVesting] = useState(false);
  const [vestingSchedule, setVestingSchedule] = useState([[0, 0, 0, 0]]);
  const [data, setData] = useState({
    token: '',
    tokensForSale: 0,
    softCap: 0,
    hardCap: 0,
    presaleRate: 0,
    minContribution: 0,
    maxContribution: 0,
    startTime: 0,
    daysToLast: 0,
    proceedsTo: '',
    admin: ''
  });
  const chain = useMemo(() => chains[chainId as unknown as keyof typeof chains], [chainId]);
  const publicSaleCreator = useMemo(() => tokenSaleCreators[chainId as unknown as keyof typeof tokenSaleCreators].publicTokenSaleCreator, [chainId]);
  const [tk, setToken] = useState<Token>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const isValidForm = useMemo(
    () =>
      !!data.token &&
      isAddress(data.token) &&
      isAddress(data.admin) &&
      isAddress(data.proceedsTo) &&
      data.softCap > 0 &&
      data.hardCap > 0 &&
      data.presaleRate > 0 &&
      data.maxContribution > 0 &&
      data.minContribution > 0 &&
      data.startTime > 0 &&
      data.daysToLast > 0 &&
      (hasVesting ? vestingSchedule.length > 0 : true),
    [
      data.admin,
      data.daysToLast,
      data.hardCap,
      data.maxContribution,
      data.minContribution,
      data.presaleRate,
      data.proceedsTo,
      data.softCap,
      data.startTime,
      data.token,
      hasVesting,
      vestingSchedule.length
    ]
  );
  const [saleCreationFee, setSaleCreationFee] = useState<number>(0);
  const [feePercentage, setFeePercentage] = useState<number>(0);

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) =>
      setData((d) => ({
        ...d,
        [e.target.name]:
          e.target.type === 'number' || e.target.type === 'datetime-local' || e.target.type === 'date' ? e.target.valueAsNumber || 0 : e.target.value
      })),
    []
  );

  const addVestingScheduleField = useCallback(() => {
    setVestingSchedule((v) => [...v, [0, 0, 0, 0]]);
  }, []);

  const removeVestingScheduleField = useCallback(
    (index: number) => {
      const mutableVestingSchedule = [...vestingSchedule];
      mutableVestingSchedule.splice(index, 1);
      setVestingSchedule(mutableVestingSchedule);
    },
    [vestingSchedule]
  );

  const handleVestingScheduleFieldChange = useCallback(
    (vestingScheduleIndex: number, itemIndex: number, value: number) => {
      const mutableVestingSchedule = [...vestingSchedule];
      const schedule = mutableVestingSchedule[vestingScheduleIndex];
      schedule.splice(itemIndex, 1, value);
      mutableVestingSchedule.splice(vestingScheduleIndex, 1, schedule);
      setVestingSchedule(mutableVestingSchedule);
    },
    [vestingSchedule]
  );

  const onSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      try {
        e.preventDefault();
        if (isValidForm && !!tk) {
          setIsLoading(true);
          const tokenAmount = parseUnits(data.tokensForSale.toString(), tk.decimals).toHexString();
          const presaleRate = parseUnits(data.presaleRate.toString(), tk.decimals).toHexString();
          const hardCap = parseEther(data.hardCap.toString()).toHexString();
          const softCap = parseEther(data.softCap.toString()).toHexString();
          const minContribution = parseEther(data.minContribution.toString()).toHexString();
          const maxContribution = parseEther(data.maxContribution.toString()).toHexString();
          const startTime = `0x${_.divide(data.startTime, 1000).toString(16)}`;

          const provider = new Web3Provider(library?.givenProvider);
          const tokenContract = new Contract(data.token, erc20Abi, provider.getSigner());
          const approvalTx = await tokenContract.approve(publicSaleCreator, tokenAmount);
          await approvalTx.wait();
          toast('Approved!', { type: 'info' });

          const saleCreatorContract = new Contract(publicSaleCreator, saleCreatorAbi, provider.getSigner());
          let initTx;

          if (!hasVesting) {
            initTx = await saleCreatorContract.createPresale(
              [
                data.token,
                tokenAmount,
                softCap,
                hardCap,
                presaleRate,
                minContribution,
                maxContribution,
                startTime,
                `0x${_.multiply(data.daysToLast, 60 * 60 * 24).toString(16)}`,
                data.proceedsTo,
                data.admin
              ],
              { value: parseEther(saleCreationFee.toString()).toHexString() }
            );
          } else {
            const vesting = _.map(vestingSchedule, (item) => [
              Math.ceil(item[0]),
              `0x${Math.floor(_.divide(item[1], 1000)).toString(16)}`,
              `0x${Math.floor(_.divide(item[2], 1000)).toString(16)}`,
              `0x${_.multiply(item[3], 60 * 60 * 24).toString(16)}`
            ]);
            initTx = await saleCreatorContract.createPresaleVestable(
              [
                data.token,
                tokenAmount,
                softCap,
                hardCap,
                presaleRate,
                minContribution,
                maxContribution,
                startTime,
                `0x${_.multiply(data.daysToLast, 60 * 60 * 24).toString(16)}`,
                data.proceedsTo,
                data.admin
              ],
              vesting,
              { value: parseEther(saleCreationFee.toString()).toHexString() }
            );
          }

          await initTx.wait();
          toast('Created successfully', { type: 'success' });
          setIsLoading(false);
        }
      } catch (error: any) {
        setIsLoading(false);
        toast(error.message, { type: 'error' });
      }
    },
    [
      data.admin,
      data.daysToLast,
      data.hardCap,
      data.maxContribution,
      data.minContribution,
      data.presaleRate,
      data.proceedsTo,
      data.softCap,
      data.startTime,
      data.token,
      data.tokensForSale,
      hasVesting,
      isValidForm,
      library?.givenProvider,
      publicSaleCreator,
      saleCreationFee,
      tk,
      vestingSchedule
    ]
  );

  useEffect(() => {
    if (!!data.token && isAddress(data.token) && !!chain) {
      (async () => {
        try {
          const token = await Fetcher.fetchTokenData(chainId || 97, data.token, chain.rpcUrl);
          setToken(token);
        } catch (error: any) {
          console.log(error);
        }
      })();
    }
  }, [data.token, chain, chainId]);

  useEffect(() => {
    if (!!publicSaleCreator && !!chain) {
      (async () => {
        const saleAbiInterface = new Interface(saleCreatorAbi);
        const data1 = saleAbiInterface.getSighash('saleCreationFee()');
        const data2 = saleAbiInterface.getSighash('feePercentage()');

        const fee = await rpcCall(chain.rpcUrl, { method: 'eth_call', params: [{ to: publicSaleCreator, data: data1 }, 'latest'] });
        const percentage = await rpcCall(chain.rpcUrl, { method: 'eth_call', params: [{ to: publicSaleCreator, data: data2 }, 'latest'] });

        setSaleCreationFee(parseFloat(formatEther(fee)));
        setFeePercentage(parseInt(percentage));
      })();
    }
  }, [chain, publicSaleCreator]);

  return (
    <div className="flex justify-center items-center mx-auto w-full flex-col md:flex-row px-2 py-2">
      <div className="card shadow-xl bg-[#000]/50 w-full md:w-1/2">
        <div className="card-body w-full overflow-auto">
          <span className="card-title font-Montserrat text-white/75">Create Presale Launch</span>
          <form onSubmit={onSubmit} className="w-full flex flex-col gap-2">
            <div className="flex flex-col justify-center gap-2">
              <label className="font-poppins text-white/60">Token*</label>
              <input
                placeholder="Token's contract address"
                type="text"
                className="outline-0 bg-[#000]/70 py-4 px-4 rounded-[12px] text-white flex-1"
                name="token"
                onChange={handleInputChange}
                value={data.token}
              />
            </div>
            <div className="flex flex-col justify-center gap-2">
              <label className="font-poppins text-white/60">Amount*</label>
              <input
                placeholder="Amount of tokens available for sale"
                type="number"
                className="outline-0 bg-[#000]/70 py-4 px-4 rounded-[12px] text-white flex-1"
                name="tokensForSale"
                onChange={handleInputChange}
                value={data.tokensForSale}
              />
              <div className="flex justify-start items-center gap-2">
                <input
                  type="checkbox"
                  onClick={() => setHasVesting((hv) => !hv)}
                  checked={hasVesting}
                  className="checkbox checkbox-accent checkbox-sm"
                />
                <span className="text-white text-[12px] font-poppins">Use vesting?</span>
              </div>
              {hasVesting && (
                <div className="flex flex-col gap-2 w-full">
                  {_.map(vestingSchedule, (item, index) => (
                    <div key={index} className="flex justify-start items-start gap-2 w-full">
                      <div className="flex justify-start items-start gap-2 flex-wrap w-full">
                        <div className="flex flex-col gap-2">
                          <label className="font-poppins text-white/60">Percentage Released*</label>
                          <input
                            type="number"
                            onChange={(ev) => handleVestingScheduleFieldChange(index, 0, ev.target.valueAsNumber || 0)}
                            value={item[0]}
                            className="outline-0 bg-[#000]/70 py-4 px-4 rounded-[12px] text-white flex-1"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-poppins text-white/60">Start Time*</label>
                          <input
                            placeholder="dd-mm-yyyy"
                            type="datetime-local"
                            className="outline-0 bg-[#000]/70 py-4 px-4 rounded-[12px] text-white flex-1"
                            pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}"
                            onChange={(ev) => handleVestingScheduleFieldChange(index, 1, ev.target.valueAsNumber || 0)}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-poppins text-white/60">End Time*</label>
                          <input
                            placeholder="dd-mm-yyyy"
                            type="datetime-local"
                            className="outline-0 bg-[#000]/70 py-4 px-4 rounded-[12px] text-white flex-1"
                            pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}"
                            onChange={(ev) => handleVestingScheduleFieldChange(index, 2, ev.target.valueAsNumber || 0)}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-poppins text-white/60">Release Cycle (Days)*</label>
                          <input
                            type="number"
                            onChange={(ev) => handleVestingScheduleFieldChange(index, 3, ev.target.valueAsNumber || 0)}
                            value={item[3]}
                            className="outline-0 bg-[#000]/70 py-4 px-4 rounded-[12px] text-white flex-1"
                          />
                        </div>
                      </div>
                      <div className="flex justify-center gap-2 items-center">
                        <button
                          onClick={() => removeVestingScheduleField(index)}
                          disabled={vestingSchedule.length === 1}
                          className="btn btn-warning btn-square"
                        >
                          <FiMinus />
                        </button>
                        {index === vestingSchedule.length - 1 && (
                          <button onClick={addVestingScheduleField} className="btn btn-primary btn-square">
                            <FiPlus />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center gap-2">
              <label className="font-poppins text-white/60">Soft Cap*</label>
              <input
                placeholder="Soft cap"
                type="number"
                className="outline-0 bg-[#000]/70 py-4 px-4 rounded-[12px] text-white flex-1"
                name="softCap"
                onChange={handleInputChange}
                value={data.softCap}
              />
            </div>
            <div className="flex flex-col justify-center gap-2">
              <label className="font-poppins text-white/60">Hard Cap*</label>
              <input
                placeholder="Hard cap"
                type="number"
                className="outline-0 bg-[#000]/70 py-4 px-4 rounded-[12px] text-white flex-1"
                name="hardCap"
                onChange={handleInputChange}
                value={data.hardCap}
              />
            </div>
            <div className="flex flex-col justify-center gap-2">
              <label className="font-poppins text-white/60">Tokens per {chain.symbol} contributed*</label>
              <input
                placeholder={`Tokens per ${chain.symbol} contributed`}
                type="number"
                className="outline-0 bg-[#000]/70 py-4 px-4 rounded-[12px] text-white flex-1"
                name="presaleRate"
                onChange={handleInputChange}
                value={data.presaleRate}
              />
            </div>
            <div className="flex flex-col justify-center gap-2">
              <label className="font-poppins text-white/60">Minimum {chain.symbol} contribution*</label>
              <input
                placeholder={`Minimum ${chain.symbol} contribution`}
                type="number"
                className="outline-0 bg-[#000]/70 py-4 px-4 rounded-[12px] text-white flex-1"
                name="minContribution"
                onChange={handleInputChange}
                value={data.minContribution}
              />
            </div>
            <div className="flex flex-col justify-center gap-2">
              <label className="font-poppins text-white/60">Maximum {chain.symbol} contribution*</label>
              <input
                placeholder={`Maximum ${chain.symbol} contribution`}
                type="number"
                className="outline-0 bg-[#000]/70 py-4 px-4 rounded-[12px] text-white flex-1"
                name="maxContribution"
                onChange={handleInputChange}
                value={data.maxContribution}
              />
            </div>
            <div className="flex flex-col justify-center gap-2">
              <label className="font-poppins text-white/60">Sale start time*</label>
              <input
                placeholder="dd-mm-yyyy"
                type="datetime-local"
                className="outline-0 bg-[#000]/70 py-4 px-4 rounded-[12px] text-white flex-1"
                pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}"
                name="startTime"
                onChange={handleInputChange}
              />
            </div>
            <div className="flex flex-col justify-center gap-2">
              <label className="font-poppins text-white/60">Days*</label>
              <input
                placeholder="Days to last"
                type="number"
                className="outline-0 bg-[#000]/70 py-4 px-4 rounded-[12px] text-white flex-1"
                name="daysToLast"
                onChange={handleInputChange}
                value={data.daysToLast}
              />
            </div>
            <div className="flex flex-col justify-center gap-2">
              <label className="font-poppins text-white/60">Proceeds to*</label>
              <input
                placeholder="Enter receiver's address"
                type="text"
                className="outline-0 bg-[#000]/70 py-4 px-4 rounded-[12px] text-white flex-1"
                name="proceedsTo"
                onChange={handleInputChange}
                value={data.proceedsTo}
              />
            </div>
            <div className="flex flex-col justify-center gap-2">
              <label className="font-poppins text-white/60">Admin*</label>
              <input
                placeholder="Enter admin's address"
                type="text"
                className="outline-0 bg-[#000]/70 py-4 px-4 rounded-[12px] text-white flex-1"
                name="admin"
                onChange={handleInputChange}
                value={data.admin}
              />
            </div>
            <div className="flex justify-between items-center w-full">
              <span className="text-white/80 font-Montserrat text-[18px]">Fee</span>
              <span className="text-white/80 font-Montserrat text-[18px]">
                {saleCreationFee} {chain.symbol} (+ {feePercentage}% {chain.symbol} raised during sale)
              </span>
            </div>
            <button
              type="submit"
              disabled={!isValidForm || isLoading || !tk}
              className={`bg-[#0cedfc] btn py-[12px] ${isLoading ? 'loading' : ''} px-[12px] rounded-[10px] w-full`}
            >
              <span className="text-[#2b2828] font-[700] text-[15px]">Create Presale Launch</span>
            </button>
          </form>
        </div>
      </div>
      <ToastContainer position="top-right" theme="dark" autoClose={5000} />
    </div>
  );
};

export default function Presales() {
  const [selectedRoute, setSelectedRoute] = useState<Subroutes>(Subroutes.ALL_ITEMS);
  const [selectedSaleItem, setSelectedSaleItem] = useState<TokenSaleItemModel>();
  const [rank, setRank] = useState<'all' | 'silver' | 'bronze' | 'unknown' | 'gold'>('all');

  return (
    <div className="h-full overflow-auto hidden-scrollbar">
      {/* <div className="flex w-full p-5 m-5">
        <div className="flex items-center w-full flex-wrap">
          <div className="flex bg-red-400 h-[80px] rounded-[15px] bg-[rgba(0,0,0,0.25)] border border-[rgba(199,199,199,0.5)] w-[168px] m-2"></div>
          <div className="flex bg-red-400 h-[80px] rounded-[15px] bg-[rgba(0,0,0,0.25)] border border-[rgba(199,199,199,0.5)] w-[168px] m-2"></div>
          <div className="flex bg-red-400 h-[80px] rounded-[15px] bg-[rgba(0,0,0,0.25)] border border-[rgba(199,199,199,0.5)] w-[168px] m-2"></div>
          <div className="flex bg-red-400 h-[80px] rounded-[15px] bg-[rgba(0,0,0,0.25)] border border-[rgba(199,199,199,0.5)] w-[168px] m-2"></div>
          <div className="flex bg-red-400 h-[80px] rounded-[15px] bg-[rgba(0,0,0,0.25)] border border-[rgba(199,199,199,0.5)] w-[168px] m-2"></div>
        </div>
      </div> */}
      {/* <div className="flex w-full mb-5">
        <div className="flex w-full items-center justify-evenly text-[#C7C7C7] font-[600] text-[14px] ">
          <div className="flex items-center ">
            <div className="flex mr-3">
              <FiBell />
            </div>
            <div className="font-Montserrat ">All Presales</div>
          </div>
          <div className="flex items-center ">
            <div className="flex mr-3">
              <FiBell />
            </div>
            <div className="font-Montserrat">My Contributions</div>
          </div>
          <div className="flex items-center ">
            <div className="flex mr-3">
              <FiBell />
            </div>
            <div className="font-Montserrat">My Alarms</div>
          </div>
          <div className="flex items-center ">
            <div className="flex mr-3">
              <FiBell />
            </div>
            <div className="font-Montserrat">Created Presales</div>
          </div>
          <div className="flex items-center ">
            <div className="flex mr-3">
              <FiBell />
            </div>
            <div className="font-Montserrat">Favorite</div>
          </div>
        </div>
      </div> */}
      <div className="flex w-full my-8">
        <div className="flex w-full items-center flex-col md:flex-row justify-between py-4 px-3">
          <div className="flex flex-1 w-full justify-center flex-col md:flex-row gap-2 py-3 px-3">
            <button
              onClick={() => setSelectedRoute(Subroutes.ALL_ITEMS)}
              className="py-2 px-3 bg-[#ffeb82] rounded-[11px] text-[#000] w-full md:w-1/3"
            >
              <span className="font-[600]">All Presale Items</span>
            </button>
            <button
              onClick={() => setSelectedRoute(Subroutes.CREATE_NEW)}
              className="flex justify-center py-2 gap-2 px-3 bg-[#ffeb82] items-center rounded-[11px] text-[#000] w-full md:w-1/3"
            >
              <FiPlus />
              <span className="font-[600]">Create</span>
            </button>
          </div>
          {selectedRoute === Subroutes.ALL_ITEMS && (
            <div className="flex flex-1 p-5 justify-end">
              <div className="dropdown">
                <div className="flex flex-col justify-center items-center">
                  <span className="text-[#c7c7c7] font-[600] text-[10px] ml-[-34px] font-Montserrat">Filter By</span>
                  <label
                    tabIndex={0}
                    className="border-[#1673b9] border-[1px] p-[5px] px-3 flex justify-center items-center rounded-[5px] text-[#fff] text-[11px] bg-transparent m-2"
                  >
                    <span className="font-[600] mr-[4px]">All Status</span>
                    <FiChevronDown />
                  </label>
                </div>
                <ul tabIndex={0} className="dropdown-content menu  shadow bg-base-100 rounded-box w-full text-[12px]">
                  <li>
                    <a onClick={() => setRank('all')}>All</a>
                  </li>
                  <li>
                    <a onClick={() => setRank('gold')}>Gold</a>
                  </li>
                  <li>
                    <a onClick={() => setRank('silver')}>Silver</a>
                  </li>
                  <li>
                    <a onClick={() => setRank('bronze')}>Bronze</a>
                  </li>
                  <li>
                    <a onClick={() => setRank('unknown')}>Unknown</a>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
      {selectedRoute === Subroutes.ALL_ITEMS && (
        <AllSalesRoute
          rank={rank}
          onClick={(item: TokenSaleItemModel) => {
            setSelectedSaleItem(item);
            setSelectedRoute(Subroutes.SINGLE_ITEM);
          }}
        />
      )}
      {selectedRoute === Subroutes.CREATE_NEW && <CreateSaleRoute />}
      {selectedRoute === Subroutes.SINGLE_ITEM && <SelectedSaleItemRoute {...(selectedSaleItem as TokenSaleItemModel)} />}
    </div>
  );
}
