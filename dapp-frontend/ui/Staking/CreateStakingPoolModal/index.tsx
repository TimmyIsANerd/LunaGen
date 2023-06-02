import { Transition, Dialog } from '@headlessui/react';
import { ChangeEvent, Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { formatEthAddress } from 'eth-address';
import { FiChevronDown, FiX } from 'react-icons/fi';
import { Step, Steps } from '../../Steps';
import { add, ceil, map, multiply, toString } from 'lodash';
import poolActions from '../../../assets/pool_actions.json';
import { useContract } from '../../../hooks/global';
import { abi as poolActionABI } from '../../../abi/StakingPoolActions.json';
import { abi as erc20ABI } from 'vefi-token-launchpad-staking/artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';
import { isAddress } from '@ethersproject/address';
import { parseEther, parseUnits } from '@ethersproject/units';
import Toast from '../../Toast';
import { AddressZero } from '@ethersproject/constants';
import { hexValue } from '@ethersproject/bytes';
import chains from '../../../assets/chains.json';
import { useWeb3Context } from '../../../contexts/web3';
import millify from 'millify';
import { TailSpin } from 'react-loader-spinner';

type CreateStakingPoolModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

enum TimeIntervals {
  DAYS = 86400,
  WEEKS = 604800,
  MONTHS = 2419200,
  YEARS = 31449600
}

export default function CreateStakingPoolModal({ isOpen, onClose }: CreateStakingPoolModalProps) {
  const { chainId } = useWeb3Context();
  const chain = useMemo(() => chains[chainId as unknown as keyof typeof chains], [chainId]);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [selectedInterval, setSelectedInterval] = useState<TimeIntervals>(TimeIntervals.DAYS);
  const [poolCreationData, setPoolCreationData] = useState({
    stakeTokenAddress: "",
    rewardTokenAddress: "",
    apy: 0,
    tax: 0,
    taxRecipient: AddressZero,
    withdrawalIntervals: 0,
    initialAmount: 0,
    daysToLast: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  const poolCreator = useContract(poolActions, poolActionABI, true);
  const stakeTokenContract = useContract(poolCreationData.stakeTokenAddress, erc20ABI, true);
  const rewardTokenContract = useContract(poolCreationData.rewardTokenAddress, erc20ABI, true);

  const setDataValue = useCallback(
    (key: string, e: ChangeEvent<HTMLInputElement>, plholder?: string | number) =>
      setPoolCreationData((d) => ({
        ...d,
        [e.target.name]: e.target[key as keyof typeof e.target] || plholder || d[e.target.name as keyof typeof poolCreationData]
      })),
    []
  );

  const clearValues = useCallback(
    () =>
      setPoolCreationData({
        stakeTokenAddress: AddressZero,
        rewardTokenAddress: AddressZero,
        apy: 0,
        tax: 0,
        taxRecipient: AddressZero,
        withdrawalIntervals: 0,
        initialAmount: 0,
        daysToLast: 0
      }),
    []
  );

  const isSubmittable = useMemo(
    () =>
      isAddress(poolCreationData.stakeTokenAddress) &&
      isAddress(poolCreationData.rewardTokenAddress) &&
      !!poolCreationData.apy &&
      poolCreationData.apy > 0 &&
      !!poolCreationData.tax &&
      isAddress(poolCreationData.taxRecipient) &&
      !!poolCreationData.withdrawalIntervals &&
      poolCreationData.withdrawalIntervals > 0 &&
      !!poolCreationData.initialAmount &&
      poolCreationData.initialAmount > 0 &&
      !!poolCreationData.daysToLast &&
      poolCreationData.daysToLast > 0 &&
      !!poolCreator,
    [
      poolCreationData.apy,
      poolCreationData.daysToLast,
      poolCreationData.initialAmount,
      poolCreationData.rewardTokenAddress,
      poolCreationData.stakeTokenAddress,
      poolCreationData.tax,
      poolCreationData.taxRecipient,
      poolCreationData.withdrawalIntervals,
      poolCreator
    ]
  );

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'info' | 'error'>('info');
  const [showToast, setShowToast] = useState(false);

  const [stakeTokenDetails, setStakeTokenDetails] = useState<any>(null);
  const [rewardTokenDetails, setRewardTokenDetails] = useState<any>(null);

  const displayToast = useCallback((msg: string, toastType: 'success' | 'info' | 'error') => {
    setToastMessage(msg);
    setToastType(toastType);
    setShowToast(true);
  }, []);

  const submit = useCallback(async () => {
    try {
      if (isSubmittable) {
        setIsLoading(true);
        let decimals = null;
        if (poolCreationData.rewardTokenAddress !== AddressZero) {
          decimals = await rewardTokenContract?.decimals();
          const approvalTx = await rewardTokenContract?.approve(poolCreator?.address, parseUnits(toString(poolCreationData.initialAmount), decimals));
          await approvalTx.wait();
          displayToast('approved', 'info');
        }

        const deploymentFee = await poolCreator?.deploymentFee();

        const deploymentTx = await poolCreator?.deployStakingPool(
          poolCreationData.stakeTokenAddress,
          poolCreationData.rewardTokenAddress,
          hexValue(poolCreationData.apy),
          hexValue(poolCreationData.tax),
          poolCreationData.taxRecipient,
          hexValue(ceil(multiply(poolCreationData.withdrawalIntervals, selectedInterval))),
          decimals ? parseUnits(poolCreationData.initialAmount.toString(), decimals) : parseEther(poolCreationData.initialAmount.toString()),
          poolCreationData.daysToLast,
          {
            value:
              poolCreationData.rewardTokenAddress !== AddressZero
                ? hexValue(deploymentFee)
                : hexValue(deploymentFee.add(parseEther(poolCreationData.initialAmount.toString()))),
                gasLimit: 500000,
          }
        );

        await deploymentTx.wait();

        displayToast('staking pool created', 'success');
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error(error);
      displayToast('transaction execution failed', 'error');
      setIsLoading(false);
    }
  }, [
    displayToast,
    isSubmittable,
    poolCreationData.apy,
    poolCreationData.daysToLast,
    poolCreationData.initialAmount,
    poolCreationData.rewardTokenAddress,
    poolCreationData.stakeTokenAddress,
    poolCreationData.tax,
    poolCreationData.taxRecipient,
    poolCreationData.withdrawalIntervals,
    poolCreator,
    rewardTokenContract,
    selectedInterval
  ]);

  useEffect(() => {
    if (stakeTokenContract) {
      (async () => {
        try {
          const name = await stakeTokenContract.name();
          const decimals = await stakeTokenContract.decimals();
          const symbol = await stakeTokenContract.symbol();

          setStakeTokenDetails({ name, decimals, symbol });
        } catch (error: any) {
          console.error(error);
        }
      })();
    } else setStakeTokenDetails(null);
  }, [stakeTokenContract]);

  useEffect(() => {
    if (rewardTokenContract) {
      (async () => {
        try {
          const name = await rewardTokenContract.name();
          const decimals = await rewardTokenContract.decimals();
          const symbol = await rewardTokenContract.symbol();

          setRewardTokenDetails({ name, symbol, decimals });
        } catch (error: any) {
          console.error(error);
        }
      })();
    } else setRewardTokenDetails(null);
  }, [rewardTokenContract]);

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10 w-screen" onClose={onClose}>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-screen w-screen items-center justify-center p-4">
              <div className="fixed inset-0 bg-[#063230] w-screen" aria-hidden="true" />
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <div className="container  top-0 bottom-0 left-0 right-0 w-screen min-h-screen mx-auto overflow-hidden bg-[#063230] flex flex-col justify-start items-center mix-blend-normal backdrop-blur-[64px] text-white">
                  <div className="bg-[#063230] px-2 py-4 w-full border-b border-[#5e5e5e]">
                    <div className="flex flex-row items-center justify-between w-full">
                      <div className="flex justify-center items-center gap-4">
                        <button
                          onClick={onClose}
                          className="text-[#E6E6E6]/[.49] text-[0.67em] border border-[#eaebec]/[.49] p-1 flex justify-center rounded-full font-[700]"
                        >
                          <FiX />
                        </button>
                        <h2 className="lg:text-2xl text-sm font-[700] font-Syne capitalize text-[#E6E6E6]">create staking pool</h2>
                      </div>
                      <div className="flex justify-center items-center gap-4">
                        {activeStep > 0 && !isSubmittable && (
                          <button
                            disabled={isSubmittable}
                            onClick={() => {
                              if (activeStep > 0) setActiveStep((step) => step - 1);
                            }}
                            className="capitalize font-Inter font-[500] border border-[#E6E6E6] text-[0.5em] lg:text-[0.85em] bg-[#063230] text-[#fff] rounded-[8px] lg:px-4 px-1 lg:py-2 py-1 shadow-[0_1px_2px_rgba(16,_24,_40,_0.05)]"
                          >
                            previous
                          </button>
                        )}
                        {isSubmittable && (
                          <button
                            onClick={clearValues}
                            className="capitalize font-Inter font-[500] border border-[#E6E6E6] text-[0.5em] lg:text-[0.85em] bg-[#063230] text-[#fff] rounded-[8px] lg:px-4 px-1 lg:py-2 py-1 shadow-[0_1px_2px_rgba(16,_24,_40,_0.05)]"
                          >
                            clear
                          </button>
                        )}
                        {activeStep === 2 && isSubmittable ? (
                          <button
                            onClick={submit}
                            disabled={isLoading || !isSubmittable}
                            className="capitalize font-Inter font-[500] border border-[#E6E6E6] text-[0.5em] lg:text-[0.85em] bg-[#063230] text-[#fff] rounded-[8px] lg:px-4 px-1 lg:py-2 py-1 shadow-[0_1px_2px_rgba(16,_24,_40,_0.05)] flex justify-center items-center gap-2"
                          >
                            submit {isLoading && <TailSpin color="#E6E6E6" visible={isLoading} width={20} height={20} />}
                          </button>
                        ) : (
                          <>
                            {activeStep < 2 && (
                              <button
                                onClick={() => {
                                  if (activeStep < 2) setActiveStep((step) => step + 1);
                                }}
                                className="capitalize font-Inter font-[500] border bg-gradient-to-br from-gray-800 to-teal-900 rounded-[8px] text-[0.5em] lg:text-[0.85em]  text-[#E6E6E6]  lg:px-4 px-1 lg:py-2 py-1 shadow-[0_1px_2px_rgba(16,_24,_40,_0.05)]"
                              >
                                next
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#063230] flex justify-center items-center w-full px-12 py-12">
                    <div className="w-full lg:w-1/2">
                      <Steps activeStep={activeStep}>
                        <Step title="token information" />
                        <Step title="staking information" />
                        <Step title="review & submit" />
                      </Steps>
                    </div>
                  </div>
                  <div className="bg-[#063230] flex-1 w-full flex justify-center items-start py-4 px-3">
                    {activeStep === 0 && (
                      <div className="bg-[#191919] rounded-[20px] px-10 py-5 lg:px-24 lg:py-10 flex flex-col justify-center items-center gap-5">
                        <span className="text-[#fff] capitalize font-Syne text-[0.85em] lg:text-[1.5em] font-[600]">
                          enter addresses of stake and reward tokens
                        </span>
                        <div className="w-full flex flex-col justify-center items-center gap-3">
                          <div className="flex flex-col justify-center items-start w-full gap-1">
                            <label className="font-Syne font-[400] text-[0.8em] capitalize text-[#E6E6E6]">stake token address</label>
                            <input
                              type="text"
                              value={poolCreationData.stakeTokenAddress}
                              className="font-Syne bg-[#fff]/[.07] w-full rounded-[8px] px-2 py-3 text-[#aeaeae] outline-0"
                              placeholder="Enter Address"
                              name="stakeTokenAddress"
                              onChange={(e) => setDataValue('value', e, AddressZero)}
                            />
                          </div>
                          <div className="flex flex-col justify-center items-start w-full gap-1">
                            <label className="font-Syne font-[400] text-[0.8em] capitalize text-[#aeaeae]">reward token address</label>
                            <input
                              value={poolCreationData.rewardTokenAddress}
                              type="text"
                              className="font-Syne bg-[#fff]/[.07] w-full rounded-[8px] px-2 py-3 text-[#aeaeae] outline-0"
                              placeholder="Enter Address"
                              name="rewardTokenAddress"
                              onChange={(e) => setDataValue('value', e, AddressZero)}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    {activeStep === 1 && (
                      <div className="bg-[#191919] rounded-[20px] px-10 py-5 lg:px-24 lg:py-10 flex flex-col justify-center items-center gap-5">
                        <span className="text-[#fff] capitalize font-Syne text-[0.85em] lg:text-[1.5em] font-[600]">
                          enter addresses of stake and reward tokens
                        </span>
                        <div className="w-full flex flex-col justify-center items-center gap-3">
                          <div className="flex flex-col justify-center items-start w-full gap-1">
                            <label className="font-Syne font-[400] text-[0.8em] capitalize text-[#aeaeae]">annual percentage yield (APY)</label>
                            <input
                              value={poolCreationData.apy}
                              type="number"
                              className="font-Syne bg-[#fff]/[.07] w-full rounded-[8px] px-2 py-3 text-[#aeaeae] outline-0"
                              placeholder="Enter APY"
                              name="apy"
                              onChange={(e) => setDataValue('valueAsNumber', e, 0)}
                            />
                          </div>
                          <div className="flex flex-col justify-center items-start w-full gap-1">
                            <label className="font-Syne font-[400] text-[0.8em] capitalize text-[#aeaeae]">tax percentage</label>
                            <input
                              value={poolCreationData.tax}
                              type="number"
                              className="font-Syne bg-[#fff]/[.07] w-full rounded-[8px] px-2 py-3 text-[#aeaeae] outline-0"
                              placeholder="Enter Incurred Tax"
                              name="tax"
                              onChange={(e) => setDataValue('valueAsNumber', e, 0)}
                            />
                          </div>
                          <div className="flex flex-col justify-center items-start w-full gap-1">
                            <label className="font-Syne font-[400] text-[0.8em] capitalize text-[#aeaeae]">tax recipient</label>
                            <input
                              type="text"
                              className="font-Syne bg-[#fff]/[.07] w-full rounded-[8px] px-2 py-3 text-[#aeaeae] outline-0"
                              placeholder="Enter Tax Recipient"
                              name="taxRecipient"
                              onChange={(e) => setDataValue('value', e, AddressZero)}
                            />
                          </div>
                          <div className="flex flex-col justify-center items-start w-full gap-1">
                            <label className="font-Syne font-[400] text-[0.8em] capitalize text-[#063230]">withdrawal intervals</label>
                            <div className="flex justify-center items-center gap-2 w-full">
                              <input
                                value={poolCreationData.withdrawalIntervals}
                                type="number"
                                className="font-Syne bg-[#fff]/[.07] w-full rounded-[8px] px-2 py-3 text-[#aeaeae] outline-0"
                                placeholder="Enter Intervals"
                                name="withdrawalIntervals"
                                onChange={(e) => setDataValue('valueAsNumber', e, 0)}
                              />
                              <div className="dropdown dropdown-bottom">
                                <label
                                  className="max-w-sm bg-[#fff]/[.07] px-3 py-4 rounded-[8px] cursor-pointer flex justify-center items-center gap-2 text-[0.75em]"
                                  tabIndex={0}
                                >
                                  {TimeIntervals[selectedInterval]}
                                  <FiChevronDown />
                                </label>
                                <ul className="dropdown-content menu p-2 shadow rounded-box w-52 bg-[#fff]/[.07] cursor-pointer">
                                  {map(
                                    Object.keys(TimeIntervals).filter((k) => !isNaN(TimeIntervals[k as keyof typeof TimeIntervals])),
                                    (interval, index) => (
                                      <li key={index}>
                                        <button onClick={() => setSelectedInterval(TimeIntervals[interval as keyof typeof TimeIntervals])}>
                                          {interval}
                                        </button>
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col justify-center items-start w-full gap-1">
                            <label className="font-Syne font-[400] text-[0.8em] capitalize text-[#aeaeae]">initial amount</label>
                            <input
                              value={poolCreationData.initialAmount}
                              type="number"
                              className="font-Syne bg-[#fff]/[.07] w-full rounded-[8px] px-2 py-3 text-[#aeaeae] outline-0"
                              placeholder="Enter Initial Amount"
                              name="initialAmount"
                              onChange={(e) => setDataValue('valueAsNumber', e, 0)}
                            />
                          </div>
                          <div className="flex flex-col justify-center items-start w-full gap-1">
                            <label className="font-Syne font-[400] text-[0.8em] capitalize text-[#aeaeae]">ends in (days)</label>
                            <input
                              type="number"
                              className="font-Syne bg-[#fff]/[.07] w-full rounded-[8px] px-2 py-3 text-[#aeaeae] outline-0"
                              placeholder="How Many Days Should This Pool Last?"
                              name="daysToLast"
                              onChange={(e) => setDataValue('valueAsNumber', e, 365)}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    {activeStep === 2 && (
                      <div className="bg-[#063230] rounded-[20px] px-10 py-5 lg:px-24 lg:py-10 flex flex-col justify-center items-center gap-5 w-full lg:w-1/2">
                        <span className="text-[#fff] capitalize font-Syne text-[0.85em] lg:text-[1.5em] font-[600]">review & submit</span>
                        <div className="w-full justify-between items-center flex gap-3 capitalize">
                          <div className="flex flex-col justify-start items-start gap-5">
                            <div className="w-full flex flex-col justify-start items-start gap-2 font-Syne">
                              <span className="text-[#aaaaaa] font-[400] text-[0.5em] lg:text-[0.8em]">stake token name</span>
                              <span className="text-[#fff] font-[500] text-[0.8em] lg:text-[1.2em]">
                                {poolCreationData.stakeTokenAddress === AddressZero
                                  ? chain.name
                                  : !!stakeTokenDetails
                                    ? stakeTokenDetails.name
                                    : 'null'}
                              </span>
                            </div>
                            <div className="w-full flex flex-col justify-start items-start gap-2 font-Syne">
                              <span className="text-[#aaaaaa] font-[400] text-[0.5em] lg:text-[0.8em]">reward token name</span>
                              <span className="text-[#fff] font-[500] text-[0.8em] lg:text-[1.2em]">
                                {poolCreationData.rewardTokenAddress === AddressZero
                                  ? chain.name
                                  : !!rewardTokenDetails
                                    ? rewardTokenDetails.name
                                    : 'null'}
                              </span>
                            </div>
                            <div className="w-full flex flex-col justify-start items-start gap-2 font-Syne">
                              <span className="text-[#aaaaaa] font-[400] text-[0.5em] lg:text-[0.8em]">stake token symbol</span>
                              <span className="text-[#fff] font-[500] text-[0.8em] lg:text-[1.2em]">
                                {poolCreationData.stakeTokenAddress === AddressZero
                                  ? chain.symbol
                                  : !!stakeTokenDetails
                                    ? stakeTokenDetails.symbol
                                    : 'null'}
                              </span>
                            </div>
                            <div className="w-full flex flex-col justify-start items-start gap-2 font-Syne">
                              <span className="text-[#aaaaaa] font-[400] text-[0.5em] lg:text-[0.8em]">reward token symbol</span>
                              <span className="text-[#fff] font-[500] text-[0.8em] lg:text-[1.2em]">
                                {poolCreationData.rewardTokenAddress === AddressZero
                                  ? chain.symbol
                                  : !!rewardTokenDetails
                                    ? rewardTokenDetails.symbol
                                    : 'null'}
                              </span>
                            </div>
                            <div className="w-full flex flex-col justify-start items-start gap-2 font-Syne">
                              <span className="text-[#aaaaaa] font-[400] text-[0.5em] lg:text-[0.8em]">apy</span>
                              <span className="text-[#fff] font-[500] text-[0.8em] lg:text-[1.2em]">{poolCreationData.apy}%</span>
                            </div>
                          </div>

                          <div className="flex flex-col justify-start items-start gap-5">
                            <div className="w-full flex flex-col justify-start items-start gap-2 font-Syne">
                              <span className="text-[#aaaaaa] font-[400] text-[0.5em] lg:text-[0.8em]">tax</span>
                              <span className="text-[#fff] font-[500] text-[0.8em] lg:text-[1.2em]">{poolCreationData.tax}%</span>
                            </div>
                            <div className="w-full flex flex-col justify-start items-start gap-2 font-Syne">
                              <span className="text-[#aaaaaa] font-[400] text-[0.5em] lg:text-[0.8em]">tax recipient</span>
                              <span className="text-[#fff] font-[500] text-[0.8em] lg:text-[1.2em]">
                                {formatEthAddress(poolCreationData.taxRecipient, 6)}
                              </span>
                            </div>
                            <div className="w-full flex flex-col justify-start items-start gap-2 font-Syne">
                              <span className="text-[#aaaaaa] font-[400] text-[0.5em] lg:text-[0.8em]">withdrawal intervals</span>
                              <span className="text-[#fff] font-[500] text-[0.8em] lg:text-[1.2em]">
                                {poolCreationData.withdrawalIntervals} {TimeIntervals[selectedInterval]}
                              </span>
                            </div>
                            <div className="w-full flex flex-col justify-start items-start gap-2 font-Syne">
                              <span className="text-[#aaaaaa] font-[400] text-[0.5em] lg:text-[0.8em]">initial amount</span>
                              <span className="text-[#fff] font-[500] text-[0.8em] lg:text-[1.2em]">
                                {millify(poolCreationData.initialAmount)}{' '}
                                {poolCreationData.rewardTokenAddress === AddressZero
                                  ? chain.symbol
                                  : !!rewardTokenDetails
                                    ? rewardTokenDetails.symbol
                                    : 'null'}
                              </span>
                            </div>
                            <div className="w-full flex flex-col justify-start items-start gap-2 font-Syne">
                              <span className="text-[#aaaaaa] font-[400] text-[0.5em] lg:text-[0.8em]">ends on</span>
                              <span className="text-[#fff] font-[500] text-[0.8em] lg:text-[1.2em]">
                                {new Date(add(Date.now(), 60 * 60 * 24 * poolCreationData.daysToLast * 1000)).toDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <Toast message={toastMessage} toastType={toastType} duration={10} onHide={() => setShowToast(false)} show={showToast} />
                  </div>
                </div>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
