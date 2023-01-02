import React, { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { FiPlus, FiMinus } from 'react-icons/fi';
import _ from 'lodash';
import { isAddress } from '@ethersproject/address';
import { Contract } from '@ethersproject/contracts';
import { Web3Provider } from '@ethersproject/providers';
import { Interface } from '@ethersproject/abi';
import { formatEther, parseEther } from '@ethersproject/units';
import { toast, ToastContainer } from 'react-toastify';
import { abi as multiSigAbi } from 'vefi-multi-sig/artifacts/contracts/MultiSigActions.sol/MultiSigActions.json';
import chains from '../../assets/chains.json';
import actions from '../../assets/multisig_actions.json';
import { useWeb3Context } from '../../contexts/web3';
import rpcCall from '../../api/rpc';

export default function CreateMultiSigWallet() {
  const { chainId, account, library } = useWeb3Context();
  const action = useMemo(() => actions[chainId as unknown as keyof typeof actions], [chainId]);
  const chain = useMemo(() => chains[chainId as unknown as keyof typeof chains], [chainId]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [networkFee, setNetworkFee] = useState<string>('0');
  const [data, setData] = useState({
    signatories: [account as string],
    requiredConfirmations: 0
  });

  useEffect(() => {
    if (action) {
      (async () => {
        const abiInterface = new Interface(multiSigAbi);
        const feeHash = abiInterface.getSighash('fee()');
        const feeVal = await rpcCall(chain.rpcUrl, { method: 'eth_call', params: [{ to: action, data: feeHash }, 'latest'] });
        setNetworkFee(formatEther(feeVal));
      })();
    }
  }, [action, chain.rpcUrl]);

  const isValidData = useMemo(
    () =>
      data.signatories.length >= 2 &&
      _.every(data.signatories, (signatory) => isAddress(signatory)) &&
      data.requiredConfirmations > 0 &&
      data.requiredConfirmations <= data.signatories.length,
    [data.requiredConfirmations, data.signatories]
  );

  const handleChangeOnSignatoryField = useCallback(
    (index: number, event: ChangeEvent<HTMLInputElement>) => {
      const mutable = [...data.signatories];
      mutable.splice(index, 1, event.target.value);
      setData((d) => ({ ...d, signatories: mutable }));
    },
    [data.signatories]
  );

  const addSignatoryField = useCallback(() => {
    const signatories = [...data.signatories, ''];
    setData((d) => ({ ...d, signatories }));
  }, [data.signatories]);

  const removeSignatoryField = useCallback(
    (index: number) => {
      const signatories = [...data.signatories];
      signatories.splice(index, 1);
      setData((d) => ({ ...d, signatories }));
    },
    [data.signatories]
  );

  const submitForm = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      try {
        event.preventDefault();
        setIsLoading(true);
        const provider = new Web3Provider(library?.givenProvider);
        const actionsContract = new Contract(action, multiSigAbi, provider.getSigner());
        const deployedTx = await actionsContract.deployMultiSigWallet(data.signatories, data.requiredConfirmations, {
          value: parseEther(networkFee)
        });
        const deployResponse = await deployedTx.wait();
        toast(
          <div className="flex justify-center gap-2 text-[16px] font-poppins items-center">
            <span className="text-white">Multisig deployed successfully!</span>
            <a href={chain.explorer.concat(`/tx/${deployResponse.transactionHash}`)} target="_blank" rel="noreferrer">
              View on explorer
            </a>
          </div>,
          { type: 'success' }
        );
        setIsLoading(false);
      } catch (error: any) {
        toast(error.message, { type: 'error' });
        setIsLoading(false);
      }
    },
    [action, chain.explorer, data.requiredConfirmations, data.signatories, library?.givenProvider, networkFee]
  );
  return (
    <div className="flex justify-center items-center mx-auto w-full flex-col md:flex-row px-2 py-2">
      <div className="shadow-xl bg-[#000]/50 rounded-[5px] w-full md:w-1/2">
        <div className="flex flex-col justify-center items-center w-full overflow-auto py-4 px-3 gap-5">
          <span className="font-Montserrat text-white/75 font-[800] text-[24px] uppercase">Create Multi-Signatory Wallet</span>
          <form onSubmit={submitForm} className="w-full flex flex-col gap-4">
            <div className="flex flex-col justify-center gap-2">
              <label className="font-poppins text-white/60 font-[600]">Signatories*</label>
              {_.map(data.signatories, (signatory, index) => (
                <div key={index} className="flex justify-center flex-col md:flex-row items-center w-full gap-2">
                  <input
                    placeholder="Enter wallet address"
                    value={signatory}
                    name={signatory}
                    onChange={(e) => handleChangeOnSignatoryField(index, e)}
                    className="outline-0 bg-transparent border-b border-white py-4 px-4 text-white flex-1 w-full"
                  />
                  <div className="flex justify-center gap-2 items-center">
                    <button
                      onClick={() => removeSignatoryField(index)}
                      disabled={data.signatories.length === 1}
                      className="py-2 px-2 text-[#fff] text-[20px]"
                    >
                      <FiMinus />
                    </button>
                    {index === data.signatories.length - 1 && (
                      <button onClick={addSignatoryField} className="py-2 px-2 text-[#fff] text-[20px]">
                        <FiPlus />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col justify-center gap-2">
              <label className="font-poppins text-white/60 font-[600]">Required confirmations*</label>
              <input
                placeholder="Set required confirmations for transaction"
                type="number"
                value={data.requiredConfirmations}
                onChange={(e) => setData((d) => ({ ...d, requiredConfirmations: e.target.valueAsNumber || 0 }))}
                className="outline-0 bg-transparent border-b border-white py-4 px-4 text-white flex-1"
              />
            </div>
            <div className="flex justify-between items-center w-full">
              <span className="text-white/80 font-Montserrat text-[18px]">Network Fee</span>
              <span className="text-white/80 font-Montserrat text-[18px]">
                {networkFee} {chain.symbol}
              </span>
            </div>
            <button
              disabled={!isValidData || isLoading}
              type="submit"
              className={`bg-[#1673b9]/50 btn py-[12px] px-[12px] rounded-[10px] w-full ${isLoading ? 'loading' : ''}`}
            >
              <span className="text-[#2b2828] font-[700] text-[15px]">Create Multi-Sig</span>
            </button>
          </form>
        </div>
      </div>
      <ToastContainer position="top-right" theme="dark" autoClose={5000} />
    </div>
  );
}
