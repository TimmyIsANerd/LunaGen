/* eslint-disable react-hooks/rules-of-hooks */
import { useMemo, useState, MouseEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiArrowDown, FiArrowUp, FiChevronRight, FiCopy, FiExternalLink } from 'react-icons/fi';
import { formatEthAddress } from 'eth-address';
import millify from 'millify';
import { TailSpin } from 'react-loader-spinner';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Moment from 'react-moment';
import { ResponsiveContainer } from 'recharts';
import { map, multiply } from 'lodash';
import { useSinglePairChartData, useSinglePairQuery } from '../../hooks/analytics';
import SquareToggleButton from '../../ui/Button/SquareToggleButton';
import BarChart from '../../ui/Chart/BarChart';
import ComposedChart from '../../ui/Chart/ComposedChart';
import { useWeb3Context } from '../../contexts/web3';
import chains from '../../assets/chains.json';
import { TBody, TCell, THead, TRow, Table } from '../../ui/Table';
import Pagination from '../../ui/Pagination';
import { useExplorerLink } from '../../hooks/global';
import { useListingAsDictionary } from '../../hooks/api';

enum Tabs {
  OVERVIEW = 'overview',
  TXNS = 'transactions'
}

enum ChartView {
  TX = 'transactions',
  VOL = 'volume'
}

enum ChartPeriod {
  H24 = 86400,
  D3 = 259200,
  D7 = 604800,
  M1 = 2419200,
  Y1 = 29030400
}

enum TransactionView {
  ALL = 'all',
  SWAPS = 'swaps',
  ADDS = 'adds',
  REMOVES = 'removes'
}

const FilterBtn = ({ isActive, onClick, children }: { isActive: boolean; onClick: (event?: MouseEvent) => any; children: any }) => (
  <button
    className={`${isActive ? 'bg-[#373b4f] rounded-[6px] text-[#a6b2ec]' : 'bg-transparent text-[#cdcccc]'
      } py-2 px-2 flex justify-center text-[0.3em] lg:text-[0.65em] font-Poppins font-[400]`}
    onClick={onClick}
  >
    {children}
  </button>
);

const OverviewChart = ({ period, pair }: { period: ChartPeriod; pair: string }) => {
  const { query, push, asPath } = useRouter();
  const chartView = useMemo(() => (query.chartView as ChartView) || ChartView.TX, [query.chartView]);
  const { isLoading, data } = useSinglePairChartData(period, pair);
  const { data: statData } = useSinglePairQuery(pair);
  const [hoverDate, setHoverDate] = useState<string | undefined>(undefined);
  const [hoverValue, setHoverValue] = useState<number | [number, number, number] | undefined>(undefined);

  return (
    <div className="w-full px-4 py-4 border border-[#5d5d5d] rounded-[8px] min-h-[24rem]">
      <div className="flex flex-col gap-5 justify-center items-start w-full">
        <div className="flex justify-start items-center gap-0 w-auto bg-[#fff]/[.07] rounded-[6px] px-1 py-1">
          <FilterBtn
            isActive={chartView === ChartView.TX}
            onClick={() =>
              push(`${new URL(asPath, window.location.href).pathname}?view=singlePair&pair=${pair}&tab=${Tabs.OVERVIEW}&chartView=${ChartView.TX}`)
            }
          >
            <span>Transactions</span>
          </FilterBtn>
          <FilterBtn
            isActive={chartView === ChartView.VOL}
            onClick={() =>
              push(`${new URL(asPath, window.location.href).pathname}?view=singlePair&pair=${pair}&tab=${Tabs.OVERVIEW}&chartView=${ChartView.VOL}`)
            }
          >
            <span>Volume</span>
          </FilterBtn>
        </div>
        <TailSpin color="#dcdcdc" visible={isLoading} width={60} height={60} />
        <div className="flex flex-col gap-1 justify-center items-center">
          {chartView !== ChartView.TX ? (
            <div className="flex flex-col justify-center items-center gap-1">
              <span className="text-[#fff] font-Syne font-[500] text-[1.35em]">
                ${hoverValue ? millify((hoverValue as [number, number, number])[0]) : statData && millify(statData.volumeUSD)}
              </span>
              <span className="text-[#fff] font-Syne font-[500] text-[1.35em]">
                {hoverValue ? millify((hoverValue as [number, number, number])[1]) : statData && millify(statData.volumeToken0)}{' '}
                {statData && statData.token0.symbol}
              </span>
              <span className="text-[#fff] font-Syne font-[500] text-[1.35em]">
                {hoverValue ? millify((hoverValue as [number, number, number])[2]) : statData && millify(statData.volumeToken1)}{' '}
                {statData && statData.token1.symbol}
              </span>
            </div>
          ) : (
            <span className="text-[#fff] font-Syne font-[500] text-[1.35em]">
              {(hoverValue as number) ?? (statData && millify(statData.txCount))}
            </span>
          )}
          <span className="text-[#23e33e] font-Syne font-[400] text-[0.85em]">
            {hoverDate ??
              new Date().toLocaleDateString(undefined, {
                year: 'numeric',
                day: 'numeric',
                month: 'short'
              })}
          </span>
        </div>
        {data && data.length > 0 && (
          <div className="flex justify-center items-center w-full min-h-[26rem]">
            <ResponsiveContainer width={'100%'} height={416}>
              {chartView === ChartView.TX ? (
                <BarChart
                  data={map(data, (item) => ({
                    date: new Date(multiply(item.date, 1000)),
                    dailyTxns: parseInt(item.dailyTxns)
                  }))}
                  width={350}
                  height={350}
                  xAxisDataKey="date"
                  barDataKey="dailyTxns"
                  hideXAxis={false}
                  hideYAxis={false}
                  yAxisOrientation="left"
                  fill="#58bd7d"
                  tooltiped
                  setHoverDate={setHoverDate}
                  setHoverValue={setHoverValue as any}
                />
              ) : (
                <ComposedChart
                  data={map(data, (item) => ({
                    date: new Date(multiply(item.date, 1000)),
                    dailyVolumeUSD: parseFloat(item.dailyVolumeUSD),
                    dailyVolumeToken0: parseFloat(item.dailyVolumeToken0),
                    dailyVolumeToken1: parseFloat(item.dailyVolumeToken1)
                  }))}
                  barDataKey="dailyVolumeUSD"
                  areaDataKey="dailyVolumeToken0"
                  lineDataKey="dailyVolumeToken1"
                  xAxisDataKey="date"
                  areaFill="#4b0082"
                  barFill="#58bd7d"
                  lineFill="#ff6838"
                  width={350}
                  height={350}
                  tooltiped
                  setHoverDate={setHoverDate}
                  setHoverValue={setHoverValue as any}
                />
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

const TransactionsList = ({ pair }: { pair: string }) => {
  const { query, push, asPath } = useRouter();
  const transactionView = useMemo(() => (query.transactionView as TransactionView) || TransactionView.ALL, [query.transactionView]);
  const { isLoading, data, error } = useSinglePairQuery(pair);
  const [allTransactionsPage, setAllTransactionsPage] = useState<number>(1);
  const [allMintsPage, setAllMintsPage] = useState<number>(1);
  const [allSwapsPage, setAllSwapsPage] = useState<number>(1);
  const [allBurnsPage, setAllBurnsPage] = useState<number>(1);
  const [allTransactionsOrder, setAllTransactionsOrder] = useState<'asc' | 'desc'>('desc');
  const [allMintsOrder, setAllMintsOrder] = useState<'asc' | 'desc'>('desc');
  const [allSwapsOrder, setAllSwapsOrder] = useState<'asc' | 'desc'>('desc');
  const [allBurnsOrder, setAllBurnsOrder] = useState<'asc' | 'desc'>('desc');

  const AllTransactions = () => (
    <div className="flex flex-col justify-center w-full items-center gap-2">
      {error ? (
        <span className="font-Poppins text-red-500 text-[0.87em]">{error.message}</span>
      ) : (
        <Table>
          <THead>
            <TRow>
              <TCell className="text-center py-2">
                <span className="capitalize">action</span>
              </TCell>
              <TCell className="text-center py-2 hidden lg:table-cell">
                <span className="capitalize">value (USD)</span>
              </TCell>
              <TCell className="text-center py-2">
                <span className="capitalize">token amount</span>
              </TCell>
              <TCell className="text-center py-2">
                <span className="capitalize">token amount</span>
              </TCell>
              <TCell className="text-center py-2 hidden lg:table-cell">
                <span className="capitalize">account</span>
              </TCell>
              <TCell className="text-center py-2">
                <span className="capitalize">transaction</span>
              </TCell>
              <TCell className="text-center py-2 hidden lg:table-cell">
                <div className="flex justify-center items-center gap-1">
                  <span className="capitalize">time</span>
                  <button
                    className="px-1 py-1 bg-transparent text-[#6093df]"
                    onClick={() => setAllTransactionsOrder(allTransactionsOrder === 'asc' ? 'desc' : 'asc')}
                  >
                    {allTransactionsOrder === 'desc' ? <FiArrowUp /> : <FiArrowDown />}
                  </button>
                </div>
              </TCell>
            </TRow>
          </THead>

          <TBody>
            <TailSpin color="#dcdcdc" visible={isLoading} width={20} height={20} />
            {map(
              data.mints
                .map((mint: any) => ({ ...mint, type: 'mint' }))
                .concat([
                  ...data.burns.map((burn: any) => ({ ...burn, type: 'burn' })),
                  ...data.swaps.map((swap: any) => ({ ...swap, type: 'swap' }))
                ])
                .slice((allTransactionsPage - 1) * 10, allTransactionsPage * 10)
                .sort((a: any, b: any) =>
                  allTransactionsOrder === 'asc' ? parseInt(a.timestamp) - parseInt(b.timestamp) : parseInt(b.timestamp) - parseInt(a.timestamp)
                ),
              (txn, i) => (
                <TRow key={i}>
                  <TCell className="text-center py-2">
                    {txn.type === 'mint' && (
                      <span className="bg-[#03c25b]/[.15] text-[#23e33e] font-Syne px-1 py-1 capitalize text-[0.75em] rounded-[30px]">add</span>
                    )}
                    {txn.type === 'burn' && (
                      <span className="bg-[#f63859]/[.1] text-[#f63859] font-Syne px-1 py-1 capitalize text-[0.75em] rounded-[30px]">remove</span>
                    )}
                    {txn.type === 'swap' && (
                      <span className="bg-[#3878d7]/[.10] text-[#3878d7] font-Syne px-1 py-1 capitalize text-[0.75em] rounded-[30px]">swap</span>
                    )}
                  </TCell>
                  <TCell className="text-center py-4 text-[#fff] font-Poppins text-[0.86em] font-[400] hidden lg:table-cell">
                    ${millify(parseFloat(txn.amountUSD))}
                  </TCell>
                  <TCell className="text-center py-2 font-[400]">
                    <div className="flex justify-center items-center flex-col gap-1">
                      <span className="text-[#fff] font-Poppins text-[0.85em]">
                        {txn.type !== 'swap' ? millify(parseFloat(txn.amount0)) : millify(parseFloat(txn.amount0In))}
                      </span>
                      <span className="text-[#aaaaaa] font-Syne text-[0.85em] uppercase">{data.token0.symbol}</span>
                    </div>
                  </TCell>
                  <TCell className="text-center py-2 font-[400]">
                    <div className="flex justify-center items-center flex-col gap-1">
                      <span className="text-[#fff] font-Poppins text-[0.85em]">
                        {txn.type !== 'swap' ? millify(parseFloat(txn.amount1)) : millify(parseFloat(txn.amount1Out))}
                      </span>
                      <span className="text-[#aaaaaa] font-Syne text-[0.85em] uppercase">{data.token1.symbol}</span>
                    </div>
                  </TCell>
                  <TCell className="text-center py-2 text-[#fff] font-Poppins text-[0.5em] lg:text-[0.85em] font-[400] hidden lg:table-cell">
                    <a target="_blank" rel="noreferrer" href={useExplorerLink('address', txn.to)}>
                      <span className="capitalize font-Syne font-[400] text-[0.5em] lg:text-[0.85em] text-[#6093df] cursor-pointer">
                        {txn.to && formatEthAddress(txn.to, 6)}
                      </span>
                    </a>
                  </TCell>
                  <TCell className="text-center py-2 text-[#fff] font-Poppins text-[0.5em] lg:text-[0.85em] font-[400]">
                    <a target="_blank" rel="noreferrer" href={useExplorerLink('tx', txn.transaction.id)}>
                      <span className="capitalize font-Syne font-[400] text-[0.5em] lg:text-[0.85em] text-[#6093df] cursor-pointer">
                        view transaction
                      </span>
                    </a>
                  </TCell>
                  <TCell className="text-center py-2 text-[#fff] font-Syne text-[0.86em] font-[400] hidden lg:table-cell">
                    <Moment date={multiply(parseInt(txn.timestamp), 1000)} fromNow ago />
                  </TCell>
                </TRow>
              )
            )}
          </TBody>
        </Table>
      )}

      <div className="px-2 py-2 w-full">
        <Pagination currentPage={allTransactionsPage} itemsPerPage={10} onPageChange={setAllTransactionsPage} dataLength={data.txCount} />
      </div>
    </div>
  );

  const Mints = () => (
    <div className="flex flex-col justify-center w-full items-center gap-2">
      {error ? (
        <span className="font-Poppins text-red-500 text-[0.87em]">{error.message}</span>
      ) : (
        <Table>
          <THead>
            <TRow>
              <TCell className="text-center py-2">
                <span className="capitalize">action</span>
              </TCell>
              <TCell className="text-center py-2 hidden lg:table-cell">
                <span className="capitalize">value (USD)</span>
              </TCell>
              <TCell className="text-center py-2">
                <span className="capitalize">token amount</span>
              </TCell>
              <TCell className="text-center py-2">
                <span className="capitalize">token amount</span>
              </TCell>
              <TCell className="text-center py-2 hidden lg:table-cell">
                <span className="capitalize">account</span>
              </TCell>
              <TCell className="text-center py-2">
                <span className="capitalize">transaction</span>
              </TCell>
              <TCell className="text-center py-2 hidden lg:table-cell">
                <div className="flex justify-center items-center gap-1">
                  <span className="capitalize">time</span>
                  <button
                    className="px-1 py-1 bg-transparent text-[#6093df]"
                    onClick={() => setAllMintsOrder(allMintsOrder === 'asc' ? 'desc' : 'asc')}
                  >
                    {allMintsOrder === 'desc' ? <FiArrowUp /> : <FiArrowDown />}
                  </button>
                </div>
              </TCell>
            </TRow>
          </THead>

          <TailSpin color="#dcdcdc" visible={isLoading} width={20} height={20} />
          <TBody>
            {map(data.mints.slice((allMintsPage - 1) * 10, allMintsPage * 10), (item, index) => (
              <TRow key={index}>
                <TCell className="text-center py-2">
                  <span className="bg-[#03c25b]/[.15] text-[#23e33e] font-Syne px-1 py-1 capitalize text-[0.75em] rounded-[30px]">add</span>
                </TCell>
                <TCell className="text-center py-4 text-[#fff] font-Poppins text-[0.86em] font-[400] hidden lg:table-cell">
                  ${millify(parseFloat(item.amountUSD))}
                </TCell>
                <TCell className="text-center py-2 font-[400]">
                  <div className="flex justify-center items-center flex-col gap-1">
                    <span className="text-[#fff] font-Poppins text-[0.85em]">{millify(parseFloat(item.amount0))}</span>
                    <span className="text-[#aaaaaa] font-Syne text-[0.85em] uppercase">{item.pair.token0.symbol}</span>
                  </div>
                </TCell>
                <TCell className="text-center py-2 font-[400]">
                  <div className="flex justify-center items-center flex-col gap-1">
                    <span className="text-[#fff] font-Poppins text-[0.85em]">{millify(parseFloat(item.amount1))}</span>
                    <span className="text-[#aaaaaa] font-Syne text-[0.85em] uppercase">{item.pair.token1.symbol}</span>
                  </div>
                </TCell>
                <TCell className="text-center py-2 text-[#fff] font-Poppins text-[0.5em] lg:text-[0.85em] font-[400] hidden lg:table-cell">
                  <a target="_blank" rel="noreferrer" href={useExplorerLink('address', item.to)}>
                    <span className="capitalize font-Syne font-[400] text-[0.5em] lg:text-[0.85em] text-[#6093df] cursor-pointer">
                      {item.to && formatEthAddress(item.to, 6)}
                    </span>
                  </a>
                </TCell>
                <TCell className="text-center py-2 text-[#fff] font-Poppins text-[0.5em] lg:text-[0.85em] font-[400]">
                  <a target="_blank" rel="noreferrer" href={useExplorerLink('tx', item.transaction.id)}>
                    <span className="capitalize font-Syne font-[400] text-[0.5em] lg:text-[0.85em] text-[#6093df] cursor-pointer">
                      view transaction
                    </span>
                  </a>
                </TCell>
                <TCell className="text-center py-2 text-[#fff] font-Syne text-[0.86em] font-[400] hidden lg:table-cell">
                  <Moment date={multiply(parseInt(item.timestamp), 1000)} fromNow ago />
                </TCell>
              </TRow>
            ))}
          </TBody>
        </Table>
      )}
      <div className="px-2 py-2 w-full">
        <Pagination currentPage={allMintsPage} itemsPerPage={10} onPageChange={setAllMintsPage} dataLength={data.mints.length} />
      </div>
    </div>
  );

  const Burns = () => (
    <div className="flex flex-col justify-center w-full items-center gap-2">
      {error ? (
        <span className="font-Poppins text-red-500 text-[0.87em]">{error.message}</span>
      ) : (
        <Table>
          <THead>
            <TRow>
              <TCell className="text-center py-2">
                <span className="capitalize">action</span>
              </TCell>
              <TCell className="text-center py-2 hidden lg:table-cell">
                <span className="capitalize">value (USD)</span>
              </TCell>
              <TCell className="text-center py-2">
                <span className="capitalize">token amount</span>
              </TCell>
              <TCell className="text-center py-2">
                <span className="capitalize">token amount</span>
              </TCell>
              <TCell className="text-center py-2 hidden lg:table-cell">
                <span className="capitalize">account</span>
              </TCell>
              <TCell className="text-center py-2">
                <span className="capitalize">transaction</span>
              </TCell>
              <TCell className="text-center py-2 hidden lg:table-cell">
                <div className="flex justify-center items-center gap-1">
                  <span className="capitalize">time</span>
                  <button
                    className="px-1 py-1 bg-transparent text-[#6093df]"
                    onClick={() => setAllBurnsOrder(allBurnsOrder === 'asc' ? 'desc' : 'asc')}
                  >
                    {allBurnsOrder === 'desc' ? <FiArrowUp /> : <FiArrowDown />}
                  </button>
                </div>
              </TCell>
            </TRow>
          </THead>

          <TailSpin color="#dcdcdc" visible={isLoading} width={20} height={20} />
          <TBody>
            {map(data.burns.slice((allBurnsPage - 1) * 10, allBurnsPage * 10), (item, index) => (
              <TRow key={index}>
                <TCell className="text-center py-2">
                  <span className="bg-[#f63859]/[.1] text-[#f63859] font-Syne px-1 py-1 capitalize text-[0.75em] rounded-[30px]">remove</span>
                </TCell>
                <TCell className="text-center py-4 text-[#fff] font-Poppins text-[0.86em] font-[400] hidden lg:table-cell">
                  ${millify(parseFloat(item.amountUSD))}
                </TCell>
                <TCell className="text-center py-2 font-[400]">
                  <div className="flex justify-center items-center flex-col gap-1">
                    <span className="text-[#fff] font-Poppins text-[0.85em]">{millify(parseFloat(item.amount0))}</span>
                    <span className="text-[#aaaaaa] font-Syne text-[0.85em] uppercase">{item.pair.token0.symbol}</span>
                  </div>
                </TCell>
                <TCell className="text-center py-2 font-[400]">
                  <div className="flex justify-center items-center flex-col gap-1">
                    <span className="text-[#fff] font-Poppins text-[0.85em]">{millify(parseFloat(item.amount1))}</span>
                    <span className="text-[#aaaaaa] font-Syne text-[0.85em] uppercase">{item.pair.token1.symbol}</span>
                  </div>
                </TCell>
                <TCell className="text-center py-2 text-[#fff] font-Poppins text-[0.5em] lg:text-[0.85em] font-[400] hidden lg:table-cell">
                  <a target="_blank" rel="noreferrer" href={useExplorerLink('address', item.to)}>
                    <span className="capitalize font-Syne font-[400] text-[0.5em] lg:text-[0.85em] text-[#6093df] cursor-pointer">
                      {item.to && formatEthAddress(item.to, 6)}
                    </span>
                  </a>
                </TCell>
                <TCell className="text-center py-2 text-[#fff] font-Poppins text-[0.5em] lg:text-[0.85em] font-[400]">
                  <a target="_blank" rel="noreferrer" href={useExplorerLink('tx', item.transaction.id)}>
                    <span className="capitalize font-Syne font-[400] text-[0.5em] lg:text-[0.85em] text-[#6093df] cursor-pointer">
                      view transaction
                    </span>
                  </a>
                </TCell>
                <TCell className="text-center py-2 text-[#fff] font-Syne text-[0.86em] font-[400] hidden lg:table-cell">
                  <Moment date={multiply(parseInt(item.timestamp), 1000)} fromNow ago />
                </TCell>
              </TRow>
            ))}
          </TBody>
        </Table>
      )}
      <div className="px-2 py-2 w-full">
        <Pagination currentPage={allBurnsPage} itemsPerPage={10} onPageChange={setAllBurnsPage} dataLength={data.burns.length} />
      </div>
    </div>
  );

  const Swaps = () => (
    <div className="flex flex-col justify-center w-full items-center gap-2">
      {error ? (
        <span className="font-Poppins text-red-500 text-[0.87em]">{error.message}</span>
      ) : (
        <Table>
          <THead>
            <TRow>
              <TCell className="text-center py-2">
                <span className="capitalize">action</span>
              </TCell>
              <TCell className="text-center py-2 hidden lg:table-cell">
                <span className="capitalize">value (USD)</span>
              </TCell>
              <TCell className="text-center py-2">
                <span className="capitalize">token amount (in)</span>
              </TCell>
              <TCell className="text-center py-2">
                <span className="capitalize">token amount (out)</span>
              </TCell>
              <TCell className="text-center py-2">
                <span className="capitalize">token amount (in)</span>
              </TCell>
              <TCell className="text-center py-2">
                <span className="capitalize">token amount (out)</span>
              </TCell>
              <TCell className="text-center py-2 hidden lg:table-cell">
                <span className="capitalize">account</span>
              </TCell>
              <TCell className="text-center py-2">
                <span className="capitalize">transaction</span>
              </TCell>
              <TCell className="text-center py-2 hidden lg:table-cell">
                <div className="flex justify-center items-center gap-1">
                  <span className="capitalize">time</span>
                  <button
                    className="px-1 py-1 bg-transparent text-[#6093df]"
                    onClick={() => setAllSwapsOrder(allSwapsOrder === 'asc' ? 'desc' : 'asc')}
                  >
                    {allSwapsOrder === 'desc' ? <FiArrowUp /> : <FiArrowDown />}
                  </button>
                </div>
              </TCell>
            </TRow>
          </THead>

          <TailSpin color="#dcdcdc" visible={isLoading} width={20} height={20} />
          <TBody>
            {map(data.swaps.slice((allSwapsPage - 1) * 10, allSwapsPage * 10), (item, index) => (
              <TRow key={index}>
                <TCell className="text-center py-2">
                  <span className="bg-[#3878d7]/[.10] text-[#3878d7] font-Syne px-1 py-1 capitalize text-[0.75em] rounded-[30px]">swap</span>
                </TCell>
                <TCell className="text-center py-4 text-[#fff] font-Poppins text-[0.86em] font-[400] hidden lg:table-cell">
                  ${millify(parseFloat(item.amountUSD))}
                </TCell>
                <TCell className="text-center py-2 font-[400]">
                  <div className="flex justify-center items-center flex-col gap-1">
                    <span className="text-[#fff] font-Poppins text-[0.85em]">{millify(parseFloat(item.amount0In))}</span>
                    <span className="text-[#aaaaaa] font-Syne text-[0.85em] uppercase">{item.pair.token0.symbol}</span>
                  </div>
                </TCell>
                <TCell className="text-center py-2 font-[400]">
                  <div className="flex justify-center items-center flex-col gap-1">
                    <span className="text-[#fff] font-Poppins text-[0.85em]">{millify(parseFloat(item.amount0Out))}</span>
                    <span className="text-[#aaaaaa] font-Syne text-[0.85em] uppercase">{item.pair.token0.symbol}</span>
                  </div>
                </TCell>
                <TCell className="text-center py-2 font-[400]">
                  <div className="flex justify-center items-center flex-col gap-1">
                    <span className="text-[#fff] font-Poppins text-[0.85em]">{millify(parseFloat(item.amount1In))}</span>
                    <span className="text-[#aaaaaa] font-Syne text-[0.85em] uppercase">{item.pair.token1.symbol}</span>
                  </div>
                </TCell>
                <TCell className="text-center py-2 font-[400]">
                  <div className="flex justify-center items-center flex-col gap-1">
                    <span className="text-[#fff] font-Poppins text-[0.85em]">{millify(parseFloat(item.amount1Out))}</span>
                    <span className="text-[#aaaaaa] font-Syne text-[0.85em] uppercase">{item.pair.token1.symbol}</span>
                  </div>
                </TCell>
                <TCell className="text-center py-2 text-[#fff] font-Poppins text-[0.5em] lg:text-[0.85em] font-[400] hidden lg:table-cell">
                  <a target="_blank" rel="noreferrer" href={useExplorerLink('address', item.to)}>
                    <span className="capitalize font-Syne font-[400] text-[0.5em] lg:text-[0.85em] text-[#6093df] cursor-pointer">
                      {item.to && formatEthAddress(item.to, 6)}
                    </span>
                  </a>
                </TCell>
                <TCell className="text-center py-2 text-[#fff] font-Poppins text-[0.5em] lg:text-[0.85em] font-[400]">
                  <a target="_blank" rel="noreferrer" href={useExplorerLink('tx', item.transaction.id)}>
                    <span className="capitalize font-Syne font-[400] text-[0.5em] lg:text-[0.85em] text-[#6093df] cursor-pointer">
                      view transaction
                    </span>
                  </a>
                </TCell>
                <TCell className="text-center py-2 text-[#fff] font-Syne text-[0.86em] font-[400] hidden lg:table-cell">
                  <Moment date={multiply(parseInt(item.timestamp), 1000)} fromNow ago />
                </TCell>
              </TRow>
            ))}
          </TBody>
        </Table>
      )}
      <div className="px-2 py-2 w-full">
        <Pagination currentPage={allSwapsPage} itemsPerPage={10} onPageChange={setAllSwapsPage} dataLength={data.swaps.length} />
      </div>
    </div>
  );

  const RenderedChild = () => {
    switch (transactionView) {
      case TransactionView.ALL:
        return <AllTransactions />;
      case TransactionView.ADDS:
        return <Mints />;
      case TransactionView.REMOVES:
        return <Burns />;
      case TransactionView.SWAPS:
        return <Swaps />;
      default:
        return <AllTransactions />;
    }
  };

  return (
    <>
      {data && (
        <div className="w-full px-0 py-4 border border-[#5d5d5d] rounded-[8px] overflow-auto hidden-scrollbar">
          <div className="w-full px-0 py-2 flex flex-col gap-3 justify-center items-center overflow-auto hidden-scrollbar">
            <div className="w-full flex justify-start items-center px-2 py-2 gap-2">
              <div className="flex justify-start items-center gap-0 w-auto bg-[#fff]/[.07] border border-[#555555] rounded-[6px] px-0 py-0">
                <FilterBtn
                  isActive={transactionView === TransactionView.ALL}
                  onClick={() =>
                    push(
                      `${new URL(asPath, window.location.href).pathname}?view=singlePair&pair=${pair}&tab=${Tabs.TXNS}&transactionView=${TransactionView.ALL
                      }`
                    )
                  }
                >
                  <span>View All</span>
                </FilterBtn>
                <FilterBtn
                  isActive={transactionView === TransactionView.SWAPS}
                  onClick={() =>
                    push(
                      `${new URL(asPath, window.location.href).pathname}?view=singlePair&pair=${pair}&tab=${Tabs.TXNS}&transactionView=${TransactionView.SWAPS
                      }`
                    )
                  }
                >
                  <span>Swaps</span>
                </FilterBtn>
                <FilterBtn
                  isActive={transactionView === TransactionView.ADDS}
                  onClick={() =>
                    push(
                      `${new URL(asPath, window.location.href).pathname}?view=singlePair&pair=${pair}&tab=${Tabs.TXNS}&transactionView=${TransactionView.ADDS
                      }`
                    )
                  }
                >
                  <span>Adds</span>
                </FilterBtn>
                <FilterBtn
                  isActive={transactionView === TransactionView.REMOVES}
                  onClick={() =>
                    push(
                      `${new URL(asPath, window.location.href).pathname}?view=singlePair&pair=${pair}&tab=${Tabs.TXNS}&transactionView=${TransactionView.REMOVES
                      }`
                    )
                  }
                >
                  <span>Removes</span>
                </FilterBtn>
              </div>
            </div>
            <RenderedChild />
          </div>
        </div>
      )}
    </>
  );
};

const usePairViewRoutes = (tab: Tabs, pair: string, period: number = 0) => {
  // eslint-disable-next-line react/display-name
  const [component, setComponent] = useState(() => () => OverviewChart({ period, pair }));

  useEffect(() => {
    if (pair) {
      switch (tab) {
        case Tabs.OVERVIEW:
          setComponent(() => () => OverviewChart({ period, pair }));
          break;
        case Tabs.TXNS:
          setComponent(() => () => TransactionsList({ pair }));
          break;
        default:
          // eslint-disable-next-line react/display-name
          setComponent(() => () => OverviewChart({ period, pair }));
          break;
      }
    }
  }, [tab, period, pair]);
  return component;
};

export default function PairView() {
  const { query, asPath, push } = useRouter();
  const tab = useMemo(() => (query.tab as Tabs) || Tabs.OVERVIEW, [query.tab]);
  const tokensListingAsDictionary = useListingAsDictionary();
  const [chartPeriod, setChartPeriod] = useState(ChartPeriod.H24);
  const { data, isLoading } = useSinglePairQuery(query.pair as string);
  const { chainId } = useWeb3Context();
  const chain = useMemo(() => chains[chainId as unknown as keyof typeof chains], [chainId]);
  const RenderedChild = usePairViewRoutes(tab, query.pair as string, chartPeriod);
  return (
    <div className="flex container mx-auto flex-col justify-center items-start gap-8 px-8 lg:px-10 py-4 lg:py-6">
      <div className="flex justify-start items-center w-full font-Syne text-[#808080] font-[500] text-[0.7em] lg:text-[0.8em] gap-2 capitalize">
        <Link href="/analytics?view=allStats">analytics</Link>
        <FiChevronRight />
        <Link href="/analytics?view=allStats&tab=pairs">pairs</Link>
        <FiChevronRight />
        <span className="text-[#105dcf]">view pair</span>
      </div>
      <TailSpin color="#dcdcdc" visible={isLoading} width={20} height={20} />
      {query.pair && data && (
        <>
          <div className="flex justify-between items-center gap-2 w-full">
            <div className="flex justify-center items-center gap-3">
              <div className="flex justify-center items-center gap-2">
                <div className="avatar">
                  <div className="w-6 lg:w-14 rounded-full">
                    <img src={tokensListingAsDictionary[data.token0.id]?.logoURI ?? '/images/placeholder_image.svg'} alt={data.token0.symbol} />
                  </div>
                </div>
                <div className="avatar">
                  <div className="w-6 lg:w-14 rounded-full">
                    <img src={tokensListingAsDictionary[data.token1.id]?.logoURI ?? '/images/placeholder_image.svg'} alt={data.token1.symbol} />
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-center items-start">
                <div className="flex justify-center items-center gap-2">
                  <span className="uppercase font-Syne text-[#fff] font-[700] text-[0.59em] lg:text-[1.4em]">
                    {data.token0.symbol}/{data.token1.symbol}
                  </span>
                  <a href={chain.explorer + `/token/${query.pair as string}`} target="_blank" rel="noreferrer">
                    <FiExternalLink className="text-[#a6b2ec] text-[0.58em] lg:text-[1.12em]" />
                  </a>
                  <CopyToClipboard text={query.pair as string}>
                    <FiCopy className="text-[#a6b2ec] text-[0.58em] lg:text-[1.12em] cursor-pointer" />
                  </CopyToClipboard>
                </div>
                <span className="capitalize font-Poppins text-[#fff] font-[400] text-[0.58em] lg:text-[1.12em]">
                  1 {data.token0.symbol} = {millify(parseFloat(data.token1Price))} {data.token1.symbol}
                </span>
              </div>
            </div>
            <div className="flex justify-center items-center gap-3">
              <Link href={`/dex?tab=liquidity&child_tab=add_liquidity&inputToken=${data.token0.id}&outputToken=${data.token1.id}`}>
                <button className="capitalize font-Inter font-[500] border border-[#3878d7] text-[0.5em] lg:text-[0.85em] bg-[#0c0c0c] text-[#3878d7] rounded-[8px] lg:px-4 px-1 lg:py-2 py-1 shadow-[0_1px_2px_rgba(16,_24,_40,_0.05)]">
                  add liquidity
                </button>
              </Link>
              <Link href={`/dex?tab=swap&inputToken=${data.token0.id}&outputToken=${data.token1.id}`}>
                <button className="capitalize font-Inter font-[500] border border-[#063230] text-[0.5em] lg:text-[0.85em] bg-[#063230] text-[#fff] rounded-[8px] lg:px-4 px-1 lg:py-2 py-1 shadow-[0_1px_2px_rgba(16,_24,_40,_0.05)]">
                  trade
                </button>
              </Link>
            </div>
          </div>
          <div className="flex justify-between items-start border-t border-[#353535] w-full px-2 py-2 overflow-auto hidden-scrollbar">
            <div className="flex justify-start items-center gap-2 lg:gap-4 w-auto">
              <SquareToggleButton
                isActive={tab === Tabs.OVERVIEW}
                onClick={() =>
                  push(`${new URL(asPath, window.location.href).pathname}?view=singlePair&pair=${query.pair as string}&tab=${Tabs.OVERVIEW}`)
                }
              >
                <span>Overview</span>
              </SquareToggleButton>
              <SquareToggleButton
                isActive={tab === Tabs.TXNS}
                onClick={() =>
                  push(`${new URL(asPath, window.location.href).pathname}?view=singlePair&pair=${query.pair as string}&tab=${Tabs.TXNS}`)
                }
              >
                <span>Transactions</span>
              </SquareToggleButton>
            </div>
            {tab === Tabs.OVERVIEW && (
              <div className="flex justify-start items-center gap-0 w-auto bg-[#fff]/[.07] border border-[#555555] rounded-[6px] px-0 py-0">
                <FilterBtn isActive={chartPeriod === ChartPeriod.H24} onClick={() => setChartPeriod(ChartPeriod.H24)}>
                  <span>24H</span>
                </FilterBtn>
                <FilterBtn isActive={chartPeriod === ChartPeriod.D3} onClick={() => setChartPeriod(ChartPeriod.D3)}>
                  <span>3D</span>
                </FilterBtn>
                <FilterBtn isActive={chartPeriod === ChartPeriod.D7} onClick={() => setChartPeriod(ChartPeriod.D7)}>
                  <span>7D</span>
                </FilterBtn>
                <FilterBtn isActive={chartPeriod === ChartPeriod.M1} onClick={() => setChartPeriod(ChartPeriod.M1)}>
                  <span>1M</span>
                </FilterBtn>
                <FilterBtn isActive={chartPeriod === ChartPeriod.Y1} onClick={() => setChartPeriod(ChartPeriod.Y1)}>
                  <span>1Y</span>
                </FilterBtn>
              </div>
            )}
          </div>
          <RenderedChild />
        </>
      )}
    </div>
  );
}
