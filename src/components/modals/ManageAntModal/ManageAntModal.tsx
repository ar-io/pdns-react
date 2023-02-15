import Table from 'rc-table';
import { useEffect, useState } from 'react';

import { useIsMobile } from '../../../hooks';
import { useGlobalState } from '../../../state/contexts/GlobalState';
import {
  ANT_INTERACTION_TYPES,
  AntMetadata,
  ArweaveTransactionID,
  ManageAntRow,
  TRANSACTION_TYPES,
} from '../../../types';
import {
  DEFAULT_ATTRIBUTES,
  mapKeyToAttribute,
} from '../../cards/AntCard/AntCard';
import { CloseIcon, NotebookIcon, PencilIcon } from '../../icons';
import TransactionStatus from '../../layout/TransactionStatus/TransactionStatus';
import TransactionModal from '../TransactionModal/TransactionModal';

const EDITABLE_FIELDS = [
  'name',
  'ticker',
  'targetID',
  'ttlSeconds',
  'controller',
];

function ManageAntModal({
  contractId,
  antDetails,
  closeModal,
}: {
  contractId: ArweaveTransactionID;
  antDetails: AntMetadata;
  closeModal?: () => void;
}) {
  const [{ arnsSourceContract }] = useGlobalState();
  const isMobile = useIsMobile();
  const [editingField, setEditingField] = useState<string>();
  const [modifiedValue, setModifiedValue] = useState<string>();
  const [rows, setRows] = useState<ManageAntRow[]>([]);
  const [transact, setTransact] = useState<boolean>(false);
  // todo: manage asset modal writes asset modifications to contract. It will auto detect if the asset is an ANT, name, or undername.
  // if the asset is a name, it will write modifications to the registry. If its an undername, it will write mods to the ant. If its an ant, it will write mods to the ant.
  const ACTIONABLE_FIELDS: {
    [x: string]: {
      fn: () => void;
      title: TRANSACTION_TYPES;
    };
  } = {
    owner: {
      fn: () => setTransact(true),
      title: TRANSACTION_TYPES.TRANSFER,
    },
  };

  useEffect(() => {
    setDetails(contractId);
  }, [contractId, antDetails]);

  function getAssociatedNames(txId: ArweaveTransactionID) {
    return Object.entries(arnsSourceContract.records)
      .map(([name, id]) => {
        if (id === txId.toString()) return name;
      })
      .filter((n) => !!n);
  }

  function setDetails(id: ArweaveTransactionID) {
    const names = getAssociatedNames(id);
    //  eslint-disable-next-line
    const { state, key, ...otherDetails } = antDetails;
    const consolidatedDetails: ManageAntRow & any = {
      status: antDetails.status ?? 0,
      associatedNames: !names.length ? 'N/A' : names.join(', '),
      name: antDetails.name ?? 'N/A',
      ticker: state?.ticker ?? 'N/A',
      targetID: otherDetails.target ?? 'N/A',
      ttlSeconds: DEFAULT_ATTRIBUTES.ttlSeconds.toString(),
      controller:
        antDetails.state?.controllers?.join(', ') ??
        antDetails.state?.owner?.toString() ??
        'N/A',
      undernames: `${names.length} / ${DEFAULT_ATTRIBUTES.maxSubdomains}`,
      owner: antDetails.state?.owner?.toString() ?? 'N/A',
    };

    const rows = Object.keys(consolidatedDetails).reduce(
      (details: ManageAntRow[], attribute: string, index: number) => {
        const detail = {
          attribute,
          value: consolidatedDetails[attribute as keyof ManageAntRow],
          editable: EDITABLE_FIELDS.includes(attribute),
          action: ACTIONABLE_FIELDS[attribute],
          key: index,
        };
        details.push(detail);
        return details;
      },
      [],
    );
    setRows(rows);
  }

  return (
    // eslint-disable-next-line
    <div style={{ padding: '5%', minWidth: '350px', gap: '0.5em' }}>
      <div
        className="flex-row flex-space-between"
        style={{
          width: '100%',
        }}
      >
        <span className="flex bold text-medium white">
          <NotebookIcon width={25} height={25} fill={'var(--text-white)'} />
          Manage ANT
        </span>
        <button className="flex pointer" onClick={closeModal}>
          <CloseIcon width="30px" height={'30px'} fill="var(--text-white)" />
        </button>
      </div>
      <Table
        showHeader={false}
        onRow={(row) => ({
          className: row.attribute === editingField ? 'active-row' : '',
        })}
        scroll={{ x: true }}
        columns={[
          {
            title: '',
            dataIndex: 'attribute',
            key: 'attribute',
            align: 'left',
            width: isMobile ? '0px' : '30%',
            className: 'white',
            render: (value: string) => {
              return `${mapKeyToAttribute(value)}:`;
            },
          },
          {
            title: '',
            dataIndex: 'value',
            key: 'value',
            align: 'left',
            width: '80%',
            className: 'white',
            render: (value: string | number, row: any) => {
              if (row.attribute === 'status')
                return (
                  <>
                    {/* TODO: add label for mobile view */}
                    <TransactionStatus confirmations={+value} />
                  </>
                );
              if (row.editable)
                return (
                  <>
                    {/* TODO: add label for mobile view */}
                    <input
                      id={row.attribute}
                      style={{
                        width: '80%',
                        fontSize: '16px',
                        background:
                          editingField === row.attribute
                            ? 'white'
                            : 'transparent',
                        border:
                          editingField === row.attribute
                            ? '2px solid #E0E0E0'
                            : 'none',
                        borderRadius: '2px',
                        color:
                          editingField === row.attribute ? 'black' : 'white',
                        padding:
                          editingField === row.attribute ? '10px ' : '10px 0px',
                        display: 'block',
                      }}
                      disabled={editingField !== row.attribute}
                      value={
                        editingField !== row.attribute ? value : modifiedValue
                      }
                      onChange={(e) => setModifiedValue(e.target.value.trim())}
                    />
                  </>
                );
              return value;
            },
          },
          {
            title: '',
            dataIndex: 'action',
            key: 'action',
            width: '10%',
            align: 'right',
            className: 'white',
            render: (value: any, row: any) => {
              //TODO: if it's got an action attached, show it
              if (row.editable) {
                return (
                  <>
                    {editingField !== row.attribute ? (
                      <button
                        onClick={() => {
                          setEditingField(row.attribute);
                          setModifiedValue(row.value);
                        }}
                      >
                        <PencilIcon
                          style={{ width: '24', height: '24', fill: 'white' }}
                        />
                      </button>
                    ) : (
                      <button
                        className="assets-manage-button"
                        style={{
                          backgroundColor: 'var(--accent)',
                          borderColor: 'var(--accent)',
                        }}
                        onClick={() => {
                          alert(
                            `Writing contract interaction...${modifiedValue}`,
                          );
                          // TODO: write contract interaction
                          setEditingField(undefined);
                          setModifiedValue(undefined);
                        }}
                      >
                        Save
                      </button>
                    )}
                  </>
                );
              }
              if (row.action) {
                return (
                  <button
                    onClick={row.action.fn}
                    className="assets-manage-button"
                  >
                    {row.action.title}
                  </button>
                );
              }
              return value;
            },
          },
        ]}
        data={rows}
      />
      {transact ? (
        <TransactionModal
          contractId={contractId}
          transactionType={TRANSACTION_TYPES.ANT}
          interactionType={ANT_INTERACTION_TYPES.TRANSFER}
          state={antDetails}
          showModal={() => {
            setTransact(!transact);
          }}
        />
      ) : (
        <></>
      )}
    </div>
  );
}

export default ManageAntModal;
