import Table from 'rc-table';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useIsMobile } from '../../../hooks';
import { useGlobalState } from '../../../state/contexts/GlobalState';
import {
  ArNSRecordEntry,
  ArweaveTransactionID,
  ManageAntRow,
} from '../../../types';
import {
  DEFAULT_ATTRIBUTES,
  mapKeyToAttribute,
} from '../../cards/AntCard/AntCard';
import { CloseIcon, NotebookIcon, PencilIcon } from '../../icons';
import TransactionStatus from '../../layout/TransactionStatus/TransactionStatus';

const EDITABLE_FIELDS = [
  'name',
  'ticker',
  'targetID',
  'ttlSeconds',
  'controller',
];

function ManageAntModal() {
  const { id } = useParams();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const [{ arnsSourceContract, arweaveDataProvider }] = useGlobalState();
  const [editingField, setEditingField] = useState<string>();
  const [modifiedValue, setModifiedValue] = useState<string>();
  const [rows, setRows] = useState<ManageAntRow[]>([]);

  useEffect(() => {
    try {
      if (!id) {
        throw Error('No id provided.');
      }
      const txId = new ArweaveTransactionID(id);
      fetchAntDetails(txId);
    } catch (error) {
      navigate('/manage');
    }
  }, [id]);

  function getAssociatedNames(txId: ArweaveTransactionID) {
    return Object.entries(arnsSourceContract.records)
      .map(([name, recordEntry]: [string, ArNSRecordEntry]) => {
        if (recordEntry.contractTxId === txId.toString()) return name;
      })
      .filter((n) => !!n);
  }

  async function fetchAntDetails(txId: ArweaveTransactionID) {
    const names = getAssociatedNames(txId);
    const [contractState, confirmations] = await Promise.all([
      arweaveDataProvider.getContractState(txId),
      arweaveDataProvider.getTransactionStatus(txId),
    ]);
    console.log(contractState);
    // TODO: add error messages and reload state to row
    const consolidatedDetails: ManageAntRow & any = {
      status: confirmations ?? 0,
      associatedNames: !names.length ? 'N/A' : names.join(', '),
      name: contractState.name ?? 'N/A',
      ticker: contractState.ticker ?? 'N/A',
      targetID: contractState.target ?? 'N/A',
      ttlSeconds: DEFAULT_ATTRIBUTES.ttlSeconds.toString(),
      controller:
        contractState.controllers?.join(', ') ??
        contractState.owner?.toString() ??
        'N/A',
      undernames: `${names.length} / ${DEFAULT_ATTRIBUTES.maxSubdomains}`,
      owner: contractState.owner?.toString() ?? 'N/A',
    };

    const rows = Object.keys(consolidatedDetails).reduce(
      (details: ManageAntRow[], attribute: string, index: number) => {
        const detail = {
          attribute,
          value: consolidatedDetails[attribute as keyof ManageAntRow],
          editable: EDITABLE_FIELDS.includes(attribute),
          action: () => alert('not implemented'), // navigate to transaction route with details
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
          Manage ANT / {id}
        </span>
        <button className="flex pointer" onClick={() => navigate('/manage')}>
          <CloseIcon width="30px" height={'30px'} fill="var(--text-white)" />
        </button>
      </div>
      <Table
        showHeader={false}
        onRow={(row: ManageAntRow) => ({
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
            className: 'icon-padding white',
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
    </div>
  );
}

export default ManageAntModal;
