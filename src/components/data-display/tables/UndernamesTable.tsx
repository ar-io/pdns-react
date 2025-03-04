import { AoANTInfo, AoANTRecord } from '@ar.io/sdk/web';
import { ExternalLinkIcon, PencilIcon, TrashIcon } from '@src/components/icons';
import ArweaveID, {
  ArweaveIdTypes,
} from '@src/components/layout/ArweaveID/ArweaveID';
import { AddUndernameModal, EditUndernameModal } from '@src/components/modals';
import ConfirmTransactionModal from '@src/components/modals/ConfirmTransactionModal/ConfirmTransactionModal';
import { usePrimaryName } from '@src/hooks/usePrimaryName';
import { ArweaveTransactionID } from '@src/services/arweave/ArweaveTransactionID';
import {
  useArNSState,
  useGlobalState,
  useModalState,
  useTransactionState,
  useWalletState,
} from '@src/state';
import dispatchANTInteraction from '@src/state/actions/dispatchANTInteraction';
import {
  ANT_INTERACTION_TYPES,
  SetRecordPayload,
  TransactionDataPayload,
  UNDERNAME_TABLE_ACTIONS,
  UndernameTableInteractionTypes,
} from '@src/types';
import {
  camelToReadable,
  decodeDomainToASCII,
  encodeDomainToASCII,
  encodePrimaryName,
  formatForMaxCharCount,
} from '@src/utils';
import { NETWORK_DEFAULTS } from '@src/utils/constants';
import eventEmitter from '@src/utils/events';
import { ColumnDef, createColumnHelper } from '@tanstack/react-table';
import Lottie from 'lottie-react';
import { Plus, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ReactNode } from 'react-markdown';
import { Link, useSearchParams } from 'react-router-dom';

import { Tooltip } from '..';
import arioLoading from '../../icons/ario-spinner.json';
import TableView from './TableView';

interface TableData {
  undername: string;
  targetId: string;
  ttlSeconds: number;
  action: ReactNode;
}

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

    if (matchFound) {
      results.push(d);
    }
  });

  return results;
}

const UndernamesTable = ({
  undernames,
  arnsDomain,
  info,
  antId,
  ownershipStatus,
  filter,
  refresh,
  isLoading,
}: {
  undernames: Record<string, AoANTRecord>;
  info?: AoANTInfo | null;
  isLoading?: boolean;
  arnsDomain?: string;
  antId?: string;
  ownershipStatus?: 'owner' | 'controller';
  filter?: string;
  refresh?: () => void;
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [{ arioProcessId, antAoClient }] = useGlobalState();
  const [{ wallet, walletAddress }] = useWalletState();
  const isOwner = walletAddress
    ? info?.Owner === walletAddress.toString()
    : false;
  const [, dispatchTransactionState] = useTransactionState();
  const [, dispatchArNSState] = useArNSState();
  const [, dispatchModalState] = useModalState();
  const { data: primaryNameData } = usePrimaryName();

  const [tableData, setTableData] = useState<Array<TableData>>([]);
  const [filteredTableData, setFilteredTableData] = useState<Array<TableData>>(
    [],
  );
  // modal state
  const [action, setAction] = useState<
    UndernameTableInteractionTypes | undefined
  >();
  const [transactionData, setTransactionData] = useState<
    TransactionDataPayload | undefined
  >();
  const [interactionType, setInteractionType] =
    useState<ANT_INTERACTION_TYPES>();
  const [selectedUndername, setSelectedUndername] = useState<string>();

  async function handleInteraction({
    payload,
    workflowName,
    processId,
  }: {
    payload: TransactionDataPayload;
    workflowName: ANT_INTERACTION_TYPES;
    processId?: string;
  }) {
    try {
      if (!processId) {
        throw new Error('Unable to interact with ANT contract - missing ID.');
      }

      if (!wallet?.contractSigner || !walletAddress) {
        throw new Error(
          'Unable to interact with ANT contract - missing signer.',
        );
      }

      const { id } = await dispatchANTInteraction({
        processId,
        payload,
        workflowName,
        signer: wallet?.contractSigner,
        owner: walletAddress?.toString(),
        dispatchTransactionState,
        dispatchArNSState,
        ao: antAoClient,
      });
      eventEmitter.emit('success', {
        name: 'Manage Undernames',
        message: (
          <span
            className="flex flex-row whitespace-nowrap"
            style={{ gap: '10px' }}
          >
            {workflowName} complete.{' '}
            <ArweaveID
              id={new ArweaveTransactionID(id)}
              type={ArweaveIdTypes.INTERACTION}
              shouldLink
              characterCount={8}
            />
          </span>
        ),
      });
      refresh && refresh();
    } catch (error) {
      eventEmitter.emit('error', error);
    } finally {
      setTransactionData(undefined);
      setInteractionType(undefined);
    }
  }

  useEffect(() => {
    if (undernames) {
      const newTableData: TableData[] = [];

      Object.entries(undernames)
        .filter(([u]) => u !== '@')
        .map(([undername, record]: any) => {
          const antHandlers = info?.Handlers ?? info?.HandlerNames ?? [];
          const data = {
            undername,
            targetId: record.transactionId,
            ttlSeconds: record.ttlSeconds,
            action: (
              <span
                className="flex flex-row justify-end pr-3 gap-3"
                style={{ gap: '15px' }}
              >
                {isOwner && (
                  <Tooltip
                    message={
                      !arnsDomain
                        ? 'Loading...'
                        : !antHandlers?.includes('approvePrimaryName') ||
                          !antHandlers?.includes('removePrimaryNames')
                        ? 'Update ANT to access Primary Names workflow'
                        : primaryNameData?.name ===
                          encodePrimaryName(undername + '_' + arnsDomain)
                        ? 'Remove Primary Name'
                        : 'Set Primary Name'
                    }
                    icon={
                      <button
                        disabled={
                          !antHandlers?.includes('approvePrimaryName') ||
                          !antHandlers?.includes('removePrimaryNames')
                        }
                        onClick={() => {
                          if (!arnsDomain || !antId) return;
                          const targetName = encodePrimaryName(
                            undername + '_' + arnsDomain,
                          );
                          if (primaryNameData?.name === targetName) {
                            // remove primary name payload
                            dispatchTransactionState({
                              type: 'setTransactionData',
                              payload: {
                                names: [targetName],
                                arioProcessId,
                                assetId: antId,
                                functionName: 'removePrimaryNames',
                              },
                            });
                          } else {
                            dispatchTransactionState({
                              type: 'setTransactionData',
                              payload: {
                                name: targetName,
                                arioProcessId,
                                assetId: arioProcessId,
                                functionName: 'primaryNameRequest',
                              },
                            });
                          }

                          dispatchModalState({
                            type: 'setModalOpen',
                            payload: { showPrimaryNameModal: true },
                          });
                        }}
                      >
                        <Star
                          className={
                            (encodePrimaryName(undername + '_' + arnsDomain) ==
                            primaryNameData?.name
                              ? 'text-primary fill-primary'
                              : 'text-grey') +
                            ` 
                    w-[18px]
                    `
                          }
                        />
                      </button>
                    }
                  />
                )}
                <button
                  className="fill-grey hover:fill-white"
                  onClick={() => {
                    setSelectedUndername(undername);
                    setAction(UNDERNAME_TABLE_ACTIONS.EDIT);
                  }}
                >
                  <PencilIcon width={'16px'} height={'16px'} fill="inherit" />
                </button>
                <button
                  className="fill-grey hover:fill-white"
                  onClick={() => {
                    setSelectedUndername(undername);
                    setAction(UNDERNAME_TABLE_ACTIONS.REMOVE);
                    setTransactionData({
                      subDomain: undername,
                    });
                    setInteractionType(ANT_INTERACTION_TYPES.REMOVE_RECORD);
                    dispatchTransactionState({
                      type: 'setWorkflowName',
                      payload: ANT_INTERACTION_TYPES.REMOVE_RECORD,
                    });
                  }}
                >
                  <TrashIcon width={'16px'} height={'16px'} fill="inherit" />
                </button>
              </span>
            ),
          };
          newTableData.push(data as TableData);
        });

      setTableData(newTableData as TableData[]);
    }

    if (!undernames || !Object.keys(undernames).length) {
      setTableData([]);
    }
  }, [undernames, primaryNameData]);

  useEffect(() => {
    if (filter) {
      setFilteredTableData(filterTableData(filter, tableData));
    } else {
      setFilteredTableData([]);
    }
  }, [filter, tableData, primaryNameData]);

  // Define columns for the table
  const columns: ColumnDef<TableData, any>[] = [
    'undername',
    'targetId',
    'ttlSeconds',
    'action',
  ].map((key) =>
    columnHelper.accessor(key as keyof TableData, {
      id: key,
      header:
        key == 'action'
          ? ''
          : key == 'targetId'
          ? 'Target ID'
          : key == 'ttlSeconds'
          ? 'TTL Seconds'
          : camelToReadable(key),
      sortDescFirst: true,
      cell: ({ row }) => {
        const rowValue = row.getValue(key) as any;
        if (!rowValue) {
          return '';
        }

        switch (key) {
          case 'undername': {
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
                    className="link gap-2 items-center w-fit"
                    to={`https://${encodeDomainToASCII(
                      rowValue,
                    )}_${encodeDomainToASCII(arnsDomain ?? '')}.${
                      NETWORK_DEFAULTS.ARNS.HOST
                    }`}
                    target="_blank"
                  >
                    {formatForMaxCharCount(decodeDomainToASCII(rowValue), 30)}{' '}
                    <ExternalLinkIcon
                      width={'12px'}
                      height={'12px'}
                      fill={'var(--text-white)'}
                    />
                  </Link>
                }
              />
            );
          }

          case 'targetId': {
            return (
              <ArweaveID
                id={rowValue}
                shouldLink={true}
                characterCount={8}
                type={ArweaveIdTypes.TRANSACTION}
              />
            );
          }
          default: {
            return rowValue;
          }
        }
      },
    }),
  );

  return (
    <div>
      <TableView
        columns={columns}
        data={
          isLoading
            ? []
            : filteredTableData.length
            ? filteredTableData
            : tableData.length
            ? tableData
            : []
        }
        isLoading={false}
        noDataFoundText={
          isLoading ? (
            <span className="h-fit flex flex-col text-white w-full items-center p-5 justify-center">
              <Lottie
                animationData={arioLoading}
                loop={true}
                className="h-[100px]"
              />
              <span>Loading Undernames...</span>
            </span>
          ) : (
            <span className="h-20 flex w-full items-center justify-center">
              No Undernames Found
            </span>
          )
        }
        defaultSortingState={{ id: 'undername', desc: true }}
        tableClass="bg-background border-[1px] border-dark-grey rounded border-collapse"
        rowClass={(props) => {
          const pad = '*:pl-4';
          if (props?.row !== undefined) {
            return (
              'hover:bg-primary-thin border-b-[1px] border-dark-grey ' + pad
            );
          }

          if (props?.headerGroup !== undefined) {
            return pad + ' border-b-[1px] border-dark-grey';
          }

          return 'border-t-[1px] border-dark-grey ' + pad;
        }}
        addOnAfterTable={
          ownershipStatus === undefined ? (
            <></>
          ) : (
            <div className="w-full flex flex-row text-primary font-semibold rounded-b-md border-b-[1px] border-x-[1px] border-dark-grey text-sm">
              <button
                className="flex flex-row w-full justify-start items-center p-3 rounded-b-md bg-background hover:bg-primary-gradient text-primary hover:text-primary fill-primary hover:fill-black transition-all"
                style={{ gap: '10px' }}
                onClick={() => setAction(UNDERNAME_TABLE_ACTIONS.CREATE)}
              >
                <Plus className="size-4 text-primary fill-black" />
                Add Undername
              </button>
            </div>
          )
        }
        paginationConfig={{
          pageSize: 8,
        }}
      />
      {action == UNDERNAME_TABLE_ACTIONS.CREATE && antId && ownershipStatus ? (
        <AddUndernameModal
          closeModal={() => {
            setSearchParams({ ...searchParams, modal: undefined });
            setAction(undefined);
          }}
          payloadCallback={(payload: SetRecordPayload) => {
            setTransactionData(payload);
            setInteractionType(ANT_INTERACTION_TYPES.SET_RECORD);
            dispatchTransactionState({
              type: 'setWorkflowName',
              payload: ANT_INTERACTION_TYPES.SET_RECORD,
            });
            setAction(undefined);
          }}
          antId={antId}
        />
      ) : (
        <> </>
      )}
      {action === UNDERNAME_TABLE_ACTIONS.EDIT &&
        selectedUndername &&
        ownershipStatus && (
          <EditUndernameModal
            antId={new ArweaveTransactionID(antId)}
            undername={selectedUndername}
            closeModal={() => {
              setSelectedUndername(undefined);
              setAction(undefined);
            }}
            payloadCallback={(p) => {
              setTransactionData(p);
              setInteractionType(ANT_INTERACTION_TYPES.EDIT_RECORD);
              dispatchTransactionState({
                type: 'setWorkflowName',
                payload: ANT_INTERACTION_TYPES.EDIT_RECORD,
              });
              setSelectedUndername(undefined);
              setAction(undefined);
            }}
          />
        )}
      {antId && transactionData && interactionType && ownershipStatus ? (
        <ConfirmTransactionModal
          interactionType={interactionType}
          confirm={() =>
            handleInteraction({
              payload: transactionData,
              workflowName: interactionType,
              processId: antId!,
            })
          }
          cancel={() => {
            setTransactionData(undefined);
            setInteractionType(undefined);
            setSelectedUndername(undefined);
          }}
        />
      ) : (
        <></>
      )}
    </div>
  );
};

export default UndernamesTable;
