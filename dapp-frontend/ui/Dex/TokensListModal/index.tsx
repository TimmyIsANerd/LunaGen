/* eslint-disable react-hooks/exhaustive-deps */
import React, { Fragment, useCallback, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FiSearch, FiX } from 'react-icons/fi';
import { filter, includes, map } from 'lodash';
import { isAddress } from '@ethersproject/address';
import TokensListItem from './list';
import Empty from '../../Empty';
import { TailSpin } from 'react-loader-spinner';
import Toast from '../../Toast';
import { useImportedTokensWithListing } from '../../../hooks/api';
import { abi as erc20Abi } from 'quasar-v1-core/artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';
import { useContract } from '../../../hooks/global';

type ITokensListModalProps = {
  onClose: () => void;
  isVisible: boolean;
  onTokenSelected: (token: string) => void;
  selectedTokens?: string[];
};

export default function TokensListModal({ onClose, isVisible, onTokenSelected, selectedTokens }: ITokensListModalProps) {
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const [toastMessage, setToastMessage] = useState<string>('');
  const { data: tokensListing, importToken } = useImportedTokensWithListing();
  const [searchValue, setSearchValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const tokenContract = useContract(searchValue, erc20Abi);

  const displayToast = useCallback((msg: string, toastType: 'success' | 'info' | 'error') => {
    setToastMessage(msg);
    setToastType(toastType);
    setShowToast(true);
  }, []);

  const addTokenUsingSearchValue = useCallback(async () => {
    try {
      if (tokenContract !== null) {
        setIsLoading(true);
        const name = await tokenContract?.name();
        const decimals = await tokenContract?.decimals();
        const symbol = await tokenContract?.symbol();
        importToken({
          name,
          logoURI: null as any,
          decimals,
          address: tokenContract?.address,
          symbol
        });
        setIsLoading(false);
        displayToast(`successfully imported token ${symbol}`, 'success');
      }
    } catch (error: any) {
      setIsLoading(false);
      displayToast(error.message, 'error');
    }
  }, [searchValue]);
  return (
    <Transition appear show={isVisible}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-[#000]/[.95]" aria-hidden="true" />
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="container top-0 bottom-0 left-0 right-0 w-[400px] mx-auto bg-[#2e2e2e] mix-blend-normal rounded-[10px] backdrop-blur-[64px] text-white">
                <div className="flex flex-col justify-center items-center w-full">
                  <div className="bg-transparent p-[30px] w-full">
                    <div className="flex flex-row">
                      <div className="flex flex-row items-center justify-between w-full">
                        <h2 className="text-2xl font-semibold font-Syne">Select Token</h2>
                        <button
                          onClick={onClose}
                          className="text-[#eaebec]/[.49] text-[0.67em] border border-[#eaebec]/[.49] p-1 flex justify-center rounded-full font-[700]"
                        >
                          <FiX />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center items-center gap-2 w-full">
                    <div className="flex justify-center items-center px-3 py-10 w-full">
                      <div className="bg-transparent rounded-[8px] py-2 flex justify-start items-center gap-1 border border-[#808080] px-2 w-full">
                        <FiSearch className="text-[1em]" />
                        <input
                          type="text"
                          value={searchValue}
                          onChange={(e) => setSearchValue(e.target.value)}
                          className="bg-transparent outline-0 font-Syne flex-1 text-[#808080]"
                          placeholder="Search token by address or name"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col justify-start items-start gap-3 w-full overflow-auto max-h-[26rem] py-2 px-1">
                      {searchValue.replace(/\s/g, '').length > 0 &&
                        filter(
                          tokensListing,
                          (model) =>
                            model.name.toLowerCase().startsWith(searchValue.toLowerCase()) ||
                            model.address.toLowerCase().startsWith(searchValue.toLowerCase())
                        ).length > 0 ? (
                        filter(
                          tokensListing,
                          (model) =>
                            model.name.toLowerCase().startsWith(searchValue.toLowerCase()) ||
                            model.address.toLowerCase().startsWith(searchValue.toLowerCase())
                        ).map((model, index) => (
                          <div key={index} className="w-full">
                            <TokensListItem
                              token={model.address}
                              disabled={includes(selectedTokens, model.address)}
                              onClick={() => {
                                onTokenSelected(model.address);
                                onClose();
                              }}
                            />
                          </div>
                        ))
                      ) : searchValue.replace(/\s/g, '').length === 0 ? (
                        map(tokensListing, (model, index) => (
                          <div key={index} className="w-full">
                            <TokensListItem
                              token={model.address}
                              disabled={includes(selectedTokens, model.address)}
                              onClick={() => {
                                onTokenSelected(model.address);
                                onClose();
                              }}
                            />
                          </div>
                        ))
                      ) : (
                        <div className="flex justify-center items-center w-full flex-col gap-2 px-2 py-2">
                          <Empty />
                          {isAddress(searchValue) && (
                            <button
                              onClick={addTokenUsingSearchValue}
                              disabled={isLoading}
                              className={`flex justify-center items-center bg-[#063230] py-4 px-3 text-[0.95em] text-white w-full rounded-[8px] gap-3 capitalize font-Syne`}
                            >
                              import token
                              {isLoading && <TailSpin color="#dcdcdc" visible={isLoading} width={20} height={20} />}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Transition.Child>
            <Toast message={toastMessage} toastType={toastType} duration={10} onHide={() => setShowToast(false)} show={showToast} />
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
