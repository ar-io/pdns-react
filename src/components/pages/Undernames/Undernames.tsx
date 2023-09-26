import { Table } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useUndernames } from '../../../hooks/useUndernames/useUndernames';
import {
  ArweaveTransactionID,
  PDNT_INTERACTION_TYPES,
  SetRecordPayload,
  TransactionDataPayload,
  UNDERNAME_TABLE_ACTIONS,
  UndernameMetadata,
} from '../../../types';
import {
  getCustomPaginationButtons,
  isArweaveTransactionID,
} from '../../../utils';
import eventEmitter from '../../../utils/events';
import TransactionSuccessCard from '../../cards/TransactionSuccessCard/TransactionSuccessCard';
import { PlusIcon } from '../../icons';
import { Loader } from '../../layout';
import { AddUndernameModal, EditUndernameModal } from '../../modals';
import ConfirmTransactionModal, {
  CONFIRM_TRANSACTION_PROPS_MAP,
} from '../../modals/ConfirmTransactionModal/ConfirmTransactionModal';
import './styles.css';

function Undernames() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [pdntId, setPDNTId] = useState<ArweaveTransactionID>();
  const [selectedRow, setSelectedRow] = useState<
    UndernameMetadata | undefined
  >();
  const [percent, setPercentLoaded] = useState<number>(0);
  const {
    isLoading: undernameTableLoading,
    percent: percentUndernamesLoaded,
    columns: undernameColumns,
    rows: undernameRows,
    selectedRow: selectedUndernameRow,
    sortAscending: undernameSortAscending,
    sortField: undernameSortField,
    action,
    setAction,
    searchOpen,
    searchText,
  } = useUndernames(pdntId);
  const [tableLoading, setTableLoading] = useState(true);
  const [tablePage, setTablePage] = useState<number>(1);

  // modal state
  const [transactionData, setTransactionData] = useState<
    TransactionDataPayload | undefined
  >();
  const [interactionType, setInteractionType] =
    useState<PDNT_INTERACTION_TYPES>();
  const [deployedTransactionId, setDeployedTransactionId] =
    useState<ArweaveTransactionID>();

  useEffect(() => {
    if (!id) {
      eventEmitter.emit('error', new Error('Missing PDNT transaction ID.'));
      navigate('/manage/ants');
      return;
    }
    setPDNTId(new ArweaveTransactionID(id));
  }, [id]);

  useEffect(() => {
    if (!id) {
      eventEmitter.emit('error', new Error('Missing ANT transaction ID.'));
      navigate('/manage/ants');
      return;
    }
    if (isArweaveTransactionID(id)) {
      setTableLoading(undernameTableLoading);
      setPercentLoaded(percentUndernamesLoaded);
      setSelectedRow(selectedUndernameRow);
    }
    setAction(action);
    if (
      action === UNDERNAME_TABLE_ACTIONS.REMOVE &&
      pdntId &&
      selectedUndernameRow?.name
    ) {
      setTransactionData({
        subDomain: selectedUndernameRow?.name,
      });
      setInteractionType(PDNT_INTERACTION_TYPES.REMOVE_RECORD);
    }
  }, [
    id,
    undernameSortAscending,
    undernameSortField,
    undernameRows,
    selectedUndernameRow,
    undernameTableLoading,
    percentUndernamesLoaded,
    action,
    searchText,
  ]);

  function updatePage(page: number) {
    setTablePage(page);
  }

  return (
    <>
      <div className="page">
        <div className="flex-column">
          {deployedTransactionId && interactionType ? (
            <TransactionSuccessCard
              txId={deployedTransactionId}
              close={() => {
                setDeployedTransactionId(undefined);
                setInteractionType(undefined);
              }}
              title={
                CONFIRM_TRANSACTION_PROPS_MAP[interactionType]?.successHeader
              }
            />
          ) : (
            <></>
          )}
          <div className="flex flex-justify-between">
            <div
              className="flex flex-row"
              style={{ justifyContent: 'space-between' }}
            >
              <h2 className="white">Manage Undernames</h2>
              <button
                className={'button-secondary center'}
                style={{
                  gap: '10px',
                  padding: '9px 12px',
                  fontSize: '14px',
                  textAlign: 'center',
                }}
                onClick={() => setAction(UNDERNAME_TABLE_ACTIONS.CREATE)}
              >
                <PlusIcon
                  width={'16px'}
                  height={'16px'}
                  fill={'var(--accent)'}
                />
                Add Undername
              </button>
            </div>
          </div>
          {tableLoading ? (
            <div
              className="flex center"
              style={{ paddingTop: '10%', justifyContent: 'center' }}
            >
              <Loader
                message={`Loading undernames... ${Math.round(percent)}%`}
              />
            </div>
          ) : (
            <Table
              onRow={() => ({ className: 'hovered-row' })}
              prefixCls="manage-undernames-table"
              bordered={false}
              scroll={{ x: true }}
              columns={undernameColumns}
              dataSource={undernameRows}
              pagination={{
                position: ['bottomCenter'],
                rootClassName: 'table-pagination',
                itemRender: (page, type, originalElement) =>
                  getCustomPaginationButtons({
                    page,
                    type,
                    originalElement,
                    currentPage: tablePage,
                  }),
                onChange: updatePage,
                showPrevNextJumpers: true,
                showSizeChanger: false,
                current: tablePage,
              }}
              locale={{
                emptyText: (
                  <div
                    className="flex flex-column center"
                    style={{
                      padding: '100px',
                      boxSizing: 'border-box',
                      width: '100%',
                    }}
                  >
                    <span className="white bold" style={{ fontSize: '16px' }}>
                      No Undernames Found
                    </span>
                    <span
                      className={'grey'}
                      style={{ fontSize: '13px', maxWidth: '400px' }}
                    >
                      Arweave Name Tokens (ANTs) provide ownership and control
                      of ArNS names. With ANTs you can easily manage, transfer,
                      and adjust your domains, as well as create undernames.
                    </span>

                    <div
                      className="flex flex-row center"
                      style={{ gap: '16px' }}
                    >
                      <button
                        className={'button-secondary center'}
                        style={{
                          gap: '10px',
                          padding: '9px 12px',
                          fontSize: '14px',
                          textAlign: 'center',
                        }}
                        onClick={() =>
                          setAction(UNDERNAME_TABLE_ACTIONS.CREATE)
                        }
                      >
                        <PlusIcon
                          width={'16px'}
                          height={'16px'}
                          fill={'var(--accent)'}
                        />
                        Add Undername
                      </button>
                    </div>
                  </div>
                ),
              }}
            />
          )}
        </div>
      </div>
      {action === UNDERNAME_TABLE_ACTIONS.CREATE && pdntId ? (
        <AddUndernameModal
          showModal={() => {
            setAction(undefined);
            setSelectedRow(undefined);
          }}
          payloadCallback={(payload: SetRecordPayload) => {
            setTransactionData(payload);
            setInteractionType(PDNT_INTERACTION_TYPES.SET_RECORD);
            setAction(undefined);
            setSelectedRow(undefined);
          }}
          antId={pdntId}
        />
      ) : (
        <> </>
      )}

      {action === UNDERNAME_TABLE_ACTIONS.EDIT &&
      pdntId &&
      selectedRow?.name ? (
        <EditUndernameModal
          showModal={() => {
            setAction(undefined);
            setSelectedRow(undefined);
          }}
          payloadCallback={(payload: SetRecordPayload) => {
            setTransactionData(payload);
            setInteractionType(PDNT_INTERACTION_TYPES.EDIT_RECORD);
            setAction(undefined);
            setSelectedRow(undefined);
          }}
          antId={pdntId}
          undername={selectedRow.name}
        />
      ) : (
        <> </>
      )}

      {pdntId && transactionData && interactionType ? (
        <ConfirmTransactionModal
          setDeployedTransactionId={(id: ArweaveTransactionID) => {
            setDeployedTransactionId(id);
            setTransactionData(undefined);
          }}
          interactionType={interactionType}
          payload={transactionData}
          assetId={pdntId}
          close={() => {
            setTransactionData(undefined);
            setSelectedRow(undefined);
            setAction(undefined);
          }}
          cancel={() => {
            setTransactionData(undefined);
            setInteractionType(undefined);
            setSelectedRow(undefined);
            setAction(undefined);
          }}
          cancelText={'Cancel'}
          confirmText="Confirm"
        />
      ) : (
        <></>
      )}
    </>
  );
}

export default Undernames;
