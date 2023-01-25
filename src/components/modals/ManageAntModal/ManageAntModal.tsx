import { useEffect, useRef, useState } from 'react';

import { useIsMobile } from '../../../hooks';
import { useGlobalState } from '../../../state/contexts/GlobalState';
import { ArweaveTransactionID } from '../../../types';
import { ANTContractState } from '../../../types';
import { NotebookIcon, PencilIcon } from '../../icons';
import CopyTextButton from '../../inputs/buttons/CopyTextButton/CopyTextButton';
import TransactionStatus from '../../layout/TransactionStatus/TransactionStatus';
import RowItem from '../../layout/tables/RowItem/RowItem';

function ManageAntModal({
  contractId,
  setShowModal,
  state,
  confirmations,
  targetId,
}: {
  contractId: ArweaveTransactionID;
  setShowModal: (show: boolean) => void;
  state: ANTContractState;
  confirmations: number;
  targetId?: string;
}) {
  const [{ arnsSourceContract }] = useGlobalState();
  const modalRef = useRef(null);
  const [antDetails, setAntDetails] = useState<any[]>();
  const isMobile = useIsMobile();
  // todo: manage asset modal writes asset modifications to contract. It will auto detect if the asset is an ANT, name, or undername.
  // if the asset is a name, it will write modifications to the registry. If its an undername, it will write mods to the ant. If its an ant, it will write mods to the ant.

  useEffect(() => {
    setDetails();
  }, [contractId, state, targetId, confirmations]);

  function handleClickOutside(e: any) {
    if (modalRef.current && modalRef.current === e.target) {
      setShowModal(false);
    }
    return;
  }

  function getAssociatedNames(txId: ArweaveTransactionID) {
    return Object.entries(arnsSourceContract.records)
      .map(([name, id]) => {
        if (id === txId.toString()) return name;
      })
      .filter((n) => !!n);
  }

  function setDetails() {
    const names = getAssociatedNames(contractId);
    const details = [
      [
        <td className="assets-table-item" key={`${contractId}-data`}>
          Status:
        </td>,
        <td
          className="assets-table-item"
          style={{ flex: 4 }}
          key={`${contractId}-data`}
        >
          <TransactionStatus
            key={`${contractId}-confirmations`}
            confirmations={confirmations}
          />
        </td>,
      ],
      [
        <td className="assets-table-item" key={`${contractId}-data`}>
          {`Associated Names (${names?.length}) :`}
        </td>,
        <td
          className="assets-table-item"
          style={{ flex: 4 }}
          key={`${contractId}-data`}
        >
          {names?.length ? names.map((name) => name).join(', ') : 'N/A'}
        </td>,
      ],
      [
        <td className="assets-table-item" key={`${contractId}-data`}>
          Nickname:
        </td>,
        <td
          className="assets-table-item"
          style={{ flex: 4 }}
          key={`${contractId}-data`}
        >
          {state?.name ? state.name : 'N/A'}
        </td>,
        <button className="button" key={`${contractId}-nickname-edit-button`}>
          <PencilIcon width={20} height={20} fill="var(--text-white)" />
        </button>,
      ],
      [
        <td className="assets-table-item" key={`${contractId}-data`}>
          Ticker:
        </td>,
        <td
          className="assets-table-item"
          style={{ flex: 4 }}
          key={`${contractId}-data`}
        >
          {state?.ticker ? state.ticker : 'N/A'}
        </td>,
        <button className="button" key={`${contractId}-ticker-edit-button`}>
          <PencilIcon width={20} height={20} fill="var(--text-white)" />
        </button>,
      ],
      [
        <td className="assets-table-item" key={`${contractId}-data`}>
          Target ID:
        </td>,
        <td
          className="assets-table-item"
          style={{ flex: 4 }}
          key={`${contractId}-data`}
        >
          {targetId ? targetId : 'N/A'}
        </td>,
        <button className="button" key={`${contractId}-targetId-edit-button`}>
          <PencilIcon width={20} height={20} fill="var(--text-white)" />
        </button>,
      ],
      [
        <td className="assets-table-item" key={`${contractId}-data`}>
          ttlSeconds:
        </td>,
        <td
          className="assets-table-item"
          style={{ flex: 4 }}
          key={`${contractId}-data`}
        >
          {state?.records['@'].ttlSeconds
            ? state.records['@'].ttlSeconds
            : 'N/A'}
        </td>,
        <button className="button" key={`${contractId}-ttl-edit-button`}>
          <PencilIcon width={20} height={20} fill="var(--text-white)" />
        </button>,
      ],
      [
        <td className="assets-table-item" key={`${contractId}-data`}>
          Controller:
        </td>,
        <td
          className="assets-table-item"
          style={{ flex: 4 }}
          key={`${contractId}-data`}
        >
          {state?.controllers ? state.controllers.toString() : 'N/A'}
        </td>,
        <button className="button" key={`${contractId}-controller-edit-button`}>
          <PencilIcon width={20} height={20} fill="var(--text-white)" />
        </button>,
      ],
      [
        <td className="assets-table-item" key={`${contractId}-data`}>
          Undernames:
        </td>,
        <td
          className="assets-table-item"
          style={{ flex: 4 }}
          key={`${contractId}-data`}
        >
          {state?.records
            ? `${Object.keys(state.records).length - 1} / 100`
            : 'N/A'}
        </td>,
        <button className="button" key={`${contractId}-records-button`}>
          <PencilIcon width={20} height={20} fill="var(--text-white)" />
        </button>,
      ],
      [
        <td className="assets-table-item" key={`${contractId}-data`}>
          Owner:
        </td>,
        <td
          className="assets-table-item"
          style={{ flex: 4 }}
          key={`${contractId}-data`}
        >
          {state?.owner ? state.owner.toString() : 'N/A'}
        </td>,
        <button
          className="assets-manage-button"
          key={`${contractId}-transfer-button`}
        >
          Transfer
        </button>,
      ],
    ];
    setAntDetails(details);
  }

  return (
    // eslint-disable-next-line
    <div
      className="modal-container"
      style={{ background: '#1E1E1E' }}
      ref={modalRef}
      onClick={handleClickOutside}
    >
      <div className="flex-column" style={{ margin: '10%' }}>
        <div
          className="flex"
          style={{
            justifyContent: 'flex-start',
            width: '100%',
          }}
        >
          <span className="flex bold text-medium white">
            <NotebookIcon width={25} height={25} fill={'var(--text-white)'} />
            &nbsp;Manage ANT:&nbsp;
            <span className="flex">
              <CopyTextButton
                displayText={
                  isMobile
                    ? `${contractId.toString().slice(0, 10)}...${contractId
                        .toString()
                        .slice(-10)}`
                    : contractId.toString()
                }
                copyText={contractId.toString()}
                size={24}
                wrapperStyle={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textColor: 'var(--bright-white)',
                }}
              />
            </span>
          </span>
        </div>
        <table className="assets-table">
          {antDetails?.map((rowDetails, index) => (
            <RowItem
              key={index}
              details={rowDetails}
              bgColor={'#1E1E1E'}
              textColor={'var(--text-white)'}
            />
          ))}
        </table>
      </div>
    </div>
  );
}

export default ManageAntModal;
