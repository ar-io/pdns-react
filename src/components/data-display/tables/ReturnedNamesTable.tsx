import { AoReturnedName, mARIOToken } from '@ar.io/sdk';
import { ChevronRightIcon, ExternalLinkIcon } from '@src/components/icons';
import Switch from '@src/components/inputs/Switch';
import { Loader } from '@src/components/layout';
import ArweaveID, {
  ArweaveIdTypes,
} from '@src/components/layout/ArweaveID/ArweaveID';
import { buildCostDetailsQuery } from '@src/hooks/useCostDetails';
import { ArweaveTransactionID } from '@src/services/arweave/ArweaveTransactionID';
import { useGlobalState, useWalletState } from '@src/state';
import { TRANSACTION_TYPES } from '@src/types';
import {
  camelToReadable,
  decodeDomainToASCII,
  encodeDomainToASCII,
  formatARIOWithCommas,
  formatDate,
  formatForMaxCharCount,
  isArweaveTransactionID,
  lowerCaseDomain,
} from '@src/utils';
import { NETWORK_DEFAULTS, START_RNP_PREMIUM } from '@src/utils/constants';
import { useQueryClient } from '@tanstack/react-query';
import { ColumnDef, Row, createColumnHelper } from '@tanstack/react-table';
import { CircleAlertIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ReactNode } from 'react-markdown';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { Tooltip } from '..';
import { RNPChart } from '../charts/RNPChart';
import TableView from './TableView';

type TableData = {
  openRow: ReactNode;
  name: string;
  startDate: number;
  closingDate: number;
  initiator: string;
  leasePrice: number | Error;
  permabuy: number | Error;
  returnType: string;
  action: ReactNode;
} & Record<string, any>;

const columnHelper = createColumnHelper<TableData>();

function filterTableData(filter: string, data: TableData[]): TableData[] {
  const results: TableData[] = [];

  data.forEach((d) => {
    let matchFound = false;

    Object.entries(d).forEach(([, v]) => {
      if (typeof v === 'object' && v !== null) {
        // Recurse into nested objects
        const nestedResults = filterTableData(filter, [v]);
        if (nestedResults.length > 0) {
          matchFound = true;
        }
      } else if (v?.toString()?.toLowerCase()?.includes(filter.toLowerCase())) {
        matchFound = true;
      }
    });
    if (!matchFound && d.antRecords) {
      Object.keys(d?.antRecords).forEach((undername) => {
        if (undername?.toLowerCase()?.includes(filter.toLowerCase())) {
          matchFound = true;
        }
      });
    }

    if (matchFound) {
      results.push(d);
    }
  });

  return results;
}

const ReturnedNamesTable = ({
  returnedNames,
  loading,
  filter,
}: {
  returnedNames?: Array<AoReturnedName & { name: string }>;
  loading: boolean;
  filter?: string;
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [{ arioProcessId, arioTicker, arioContract }] = useGlobalState();
  const [{ walletAddress }] = useWalletState();

  const [tableData, setTableData] = useState<Array<TableData>>([]);
  const [filteredTableData, setFilteredTableData] = useState<TableData[]>([]);
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') ?? 'name');

  const dateNow = useMemo(() => {
    return Date.now();
  }, []);

  useEffect(() => {
    setSortBy(searchParams.get('sortBy') ?? 'name');
  }, [searchParams]);

  useEffect(() => {
    if (loading) {
      setTableData([]);
      setFilteredTableData([]);
      return;
    }
    if (returnedNames) {
      const newTableData: TableData[] = [];

      returnedNames.map((nameData) => {
        const { name, initiator, startTimestamp, endTimestamp } = nameData;
        const data: TableData = {
          openRow: <></>,
          name,
          startDate: startTimestamp,
          closingDate: endTimestamp,
          initiator,
          leasePrice: -1,
          permabuy: -1,
          returnType:
            initiator === arioProcessId ? 'Lease Expiry' : 'Permanent Return',

          action: <></>,
          // metadata used for search and other purposes
          returnNameData: nameData,
        };
        newTableData.push(data);
      });

      setTableData(newTableData);
    }
  }, [returnedNames, loading]);
  async function fetchPrice(
    name: string,
    type: TRANSACTION_TYPES,
  ): Promise<number | Error> {
    try {
      const res = await queryClient.fetchQuery(
        buildCostDetailsQuery(
          {
            intent: 'Buy-Name',
            name,
            type,
            years: 1,
            fromAddress: walletAddress?.toString(),
          },
          { arioContract, arioProcessId },
        ),
      );

      // calculate current price
      if (!res.returnedNameDetails) {
        throw new Error('Returned Name Details not found');
      }
      const {
        startTimestamp,
        endTimestamp,
        basePrice: endPrice,
      } = res.returnedNameDetails;
      const startPrice = endPrice * START_RNP_PREMIUM;
      const percent =
        (dateNow - startTimestamp) / (endTimestamp - startTimestamp);
      return Math.round(startPrice + (endPrice - startPrice) * percent);
    } catch (error: any) {
      return new Error(error.message);
    }
  }
  useEffect(() => {
    async function updatePrices() {
      // Filter rows that need price updates
      const rowsToUpdate = tableData.filter(
        (row) =>
          row.leasePrice instanceof Error ||
          row.leasePrice < 0 ||
          row.permabuy instanceof Error ||
          row.permabuy < 0,
      );

      if (rowsToUpdate.length === 0) {
        // No rows need updates, exit early
        return;
      }

      const updatedData = await Promise.all(
        tableData.map(async (row) => {
          if (
            row.leasePrice instanceof Error ||
            row.leasePrice < 0 ||
            row.permabuy instanceof Error ||
            row.permabuy < 0
          ) {
            // Fetch lease price
            const leasePrice = await fetchPrice(
              row.name,
              TRANSACTION_TYPES.LEASE,
            );
            // Fetch permabuy price
            const permabuyPrice = await fetchPrice(
              row.name,
              TRANSACTION_TYPES.BUY,
            );

            // Return updated row with fetched prices
            return {
              ...row,
              leasePrice,
              permabuy: permabuyPrice,
            };
          }
          // Return the row unchanged if no update is needed
          return row;
        }),
      );

      // Set updated table data
      setTableData(updatedData);
    }

    updatePrices();
  }, [tableData]); // Re-run only when `tableData` changes

  useEffect(() => {
    if (filter) {
      setFilteredTableData(filterTableData(filter, tableData));
    } else {
      setFilteredTableData([]);
    }
  }, [filter, tableData]);
  // Define columns for the table
  const columns: ColumnDef<TableData, any>[] = [
    'openRow',
    'name',
    'startDate',
    'closingDate',
    'initiator',
    'leasePrice',
    'permabuy',
    'returnType',
    'action',
  ].map((key) =>
    columnHelper.accessor(key as keyof TableData, {
      id: key,
      size: key == 'action' || key == 'openRow' ? 20 : undefined,
      header:
        key == 'action' || key == 'openRow'
          ? ''
          : key == 'leasePrice'
          ? 'Price for 1 Year'
          : camelToReadable(key),
      sortDescFirst: true,
      sortingFn: 'alphanumeric',
      cell: ({ row }) => {
        const rowValue = row.getValue(key) as any;
        if (rowValue === undefined || rowValue === null) {
          return '';
        }

        switch (key) {
          case 'openRow': {
            return (
              <button
                onClick={() => row.toggleExpanded()}
                style={{
                  transform: row.getIsExpanded() ? 'rotate(90deg)' : undefined,
                }}
              >
                <ChevronRightIcon
                  width={'18px'}
                  height={'18px'}
                  fill={'var(--text-white)'}
                />
              </button>
            );
          }
          case 'name': {
            return (
              <Tooltip
                tooltipOverrides={{
                  overlayClassName: 'w-fit',
                  overlayInnerStyle: { width: 'fit-content' },
                }}
                message={
                  <span className="w-fit whitespace-nowrap text-white">
                    {rowValue}
                  </span>
                }
                icon={
                  <Link
                    className="link gap-2 w-fit items-center"
                    to={`https://${encodeDomainToASCII(row.getValue('name'))}.${
                      NETWORK_DEFAULTS.ARNS.HOST
                    }`}
                    target="_blank"
                  >
                    {formatForMaxCharCount(decodeDomainToASCII(rowValue), 20)}{' '}
                    <ExternalLinkIcon className="size-3 fill-grey" />
                  </Link>
                }
              />
            );
          }
          case 'startDate': {
            return formatDate(rowValue);
          }
          case 'closingDate': {
            return formatDate(rowValue);
          }
          case 'initiator': {
            return isArweaveTransactionID(rowValue) ? (
              <ArweaveID
                id={new ArweaveTransactionID(rowValue)}
                shouldLink
                characterCount={12}
                type={ArweaveIdTypes.ADDRESS}
              />
            ) : (
              rowValue
            );
          }
          case 'leasePrice':
          case 'permabuy': {
            if (rowValue instanceof Error)
              return (
                <Tooltip
                  message={rowValue.message}
                  icon={
                    <span className="text-error">
                      Price Error{' '}
                      <CircleAlertIcon width={'18px'} height={'18px'} />
                    </span>
                  }
                />
              );
            if (rowValue < 0)
              return (
                <span className="text-white animate-pulse">Loading...</span>
              );
            return `${formatARIOWithCommas(
              new mARIOToken(rowValue).toARIO().valueOf(),
            )} ${arioTicker}`;
          }
          case 'returnType': {
            return rowValue;
          }

          case 'action': {
            return (
              <div className="flex justify-end w-full ">
                <span className="flex pr-3 w-fit h-fit gap-3 items-center justify-center overflow-visible max-h-[15px]">
                  <button
                    className="p-2 py-[0.4rem] text-center size-fit rounded text-black bg-primary"
                    onClick={() => {
                      navigate(
                        `/register/${lowerCaseDomain(row.original.name)}`,
                      );
                    }}
                  >
                    Register
                  </button>
                </span>
              </div>
            );
          }

          default: {
            return rowValue;
          }
        }
      },
    }),
  );

  const RNPChartSubComponent = ({ row }: { row: Row<TableData> }) => {
    const [purchaseType, setPurchaseType] = useState<TRANSACTION_TYPES>(
      TRANSACTION_TYPES.LEASE,
    );

    return (
      <div className="flex flex-col w-full gap-6 h-[400px] p-6">
        <div className="flex justify-between items-center text-grey">
          <span>Returned Name</span>
          <div className="flex gap-4 items-center justify-center">
            <span>
              {purchaseType === TRANSACTION_TYPES.LEASE
                ? 'Lease for 1 Year'
                : 'Permabuy'}
            </span>
            <Switch
              checked={purchaseType === TRANSACTION_TYPES.BUY}
              onChange={(checked: boolean) =>
                setPurchaseType(
                  checked ? TRANSACTION_TYPES.BUY : TRANSACTION_TYPES.LEASE,
                )
              }
              className={{
                root: 'outline-none size-full w-[3rem] rounded-full border border-dark-grey',
                thumb:
                  'block size-[21px] translate-x-0.5 rounded-full bg-primary transition-transform duration-100 will-change-transform data-[state=checked]:translate-x-[1.43rem]',
              }}
            />
          </div>
        </div>
        <RNPChart
          name={row.original.name}
          purchaseDetails={{
            type: purchaseType,
          }}
          dateNow={dateNow}
        />
      </div>
    );
  };

  return (
    <>
      <div className="w-full">
        <TableView
          columns={columns}
          data={
            filteredTableData.length
              ? filteredTableData
              : tableData.length
              ? tableData
              : []
          }
          isLoading={false}
          noDataFoundText={
            loading ? (
              <div className="flex flex-column center white p-[100px]">
                <Loader message="Loading assets..." />
              </div>
            ) : (
              <div className="flex flex-column center p-[100px]">
                <>
                  <span
                    className="white font-bold"
                    style={{ fontSize: '16px' }}
                  >
                    No Returned Names Found
                  </span>
                </>

                <div className="flex flex-row center" style={{ gap: '16px' }}>
                  <Link
                    to="/"
                    className="bg-primary rounded-md text-black center hover px-4 py-3 text-sm"
                  >
                    Search for a Name
                  </Link>
                </div>
              </div>
            )
          }
          defaultSortingState={{
            id: sortBy,
            desc: sortBy == 'closingData' ? false : true,
          }}
          renderSubComponent={({ row }) => <RNPChartSubComponent row={row} />}
          tableClass="overflow-hidden rounded"
          tableWrapperClassName="border border-dark-grey rounded"
          rowClass={(props) => {
            if (props?.headerGroup) {
              return 'rounded-t';
            }
            if (props?.row !== undefined) {
              return props.row.getIsExpanded()
                ? 'bg-[#1B1B1D] '
                : 'overflow-hidden' +
                    '  data-[id=renderSubComponent]:hover:bg-background';
            }

            return '';
          }}
          dataClass={(props) => {
            if (props?.headerGroup) {
              return 'rounded-t whitespace-nowrap';
            }
            if (props?.row !== undefined && props.row.getIsExpanded()) {
              return 'border-t-[1px] border-dark-grey border-b-0';
            }

            return '';
          }}
          headerClass="bg-foreground rounded-t"
        />
      </div>
    </>
  );
};

export default ReturnedNamesTable;
