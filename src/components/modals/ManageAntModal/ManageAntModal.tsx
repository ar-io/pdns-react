import { useEffect, useRef, useState } from 'react';

import { ArweaveTransactionID } from '../../../../types/ArweaveTransactionID';
import { useIsMobile } from '../../../hooks';
import { useGlobalState } from '../../../state/contexts/GlobalState';
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
  const [associatedNames, setAssociatedNames] = useState<Array<string>>([]);
  const isMobile = useIsMobile();
  // todo: manage asset modal writes asset modifications to contract. It will auto detect if the asset is an ANT, name, or undername.
  // if the asset is a name, it will write modifications to the registry. If its an undername, it will write mods to the ant. If its an ant, it will write mods to the ant.

  useEffect(() => {
    setAssociatedNames(getAssociatedNames());
  }, [contractId, state]);

  function handleClickOutside(e: any) {
    if (modalRef.current && modalRef.current === e.target) {
      setShowModal(false);
    }
    return;
  }

  function getAssociatedNames() {
    const domains: string[] = [];
    Object.entries(arnsSourceContract.records).map(([name, id]) => {
      if (id === contractId) {
        domains.push(name);
      }
    });
    return domains;
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
        <div className="flex flex-row">
          <span
            className="flex section-header"
            style={{
              justifyContent: 'flex-start',
              width: '100%',
            }}
          >
            <NotebookIcon width={25} height={25} fill={'var(--text-white)'} />
            &nbsp;Manage ANT:&nbsp;
            <span>
              {isMobile ? (
                <CopyTextButton
                  displayText={`${contractId
                    .toString()
                    .slice(0, 10)}...${contractId.toString().slice(-10)}`}
                  copyText={contractId.toString()}
                  size={24}
                  wrapperStyle={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textColor: 'var(--bright-white)',
                  }}
                />
              ) : (
                <CopyTextButton
                  displayText={contractId.toString()}
                  copyText={contractId.toString()}
                  size={24}
                  wrapperStyle={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textColor: 'var(--bright-white)',
                  }}
                />
              )}
            </span>
          </span>
        </div>
        <table className="assets-table">
          <RowItem
            details={[
              'Status:',
              <TransactionStatus
                key={`${contractId}-confirmations`}
                confirmations={confirmations}
              />,
            ]}
            bgColor={'#1E1E1E'}
            textColor={'var(--text-white)'}
          />
          <RowItem
            details={[
              `Associated Names ${associatedNames.length}:`,
              associatedNames
                ? associatedNames.map((name) => (
                    <>
                      <span
                        className="assets-manage-button"
                        key={`${contractId}-name`}
                      >
                        {name}
                      </span>
                      &nbsp;
                    </>
                  ))
                : 'N/A',
            ]}
            bgColor={'#1E1E1E'}
            textColor={'var(--text-white)'}
          />
          <RowItem
            details={[
              'Nickname:',
              state?.name ? state.name : 'N/A',
              <button
                className="button"
                key={`${contractId}-nickname-edit-button`}
              >
                <PencilIcon width={20} height={20} fill="var(--text-white)" />
              </button>,
            ]}
            bgColor={'#1E1E1E'}
            textColor={'var(--text-white)'}
          />
          <RowItem
            details={[
              'Ticker:',
              state?.ticker ? state.ticker : 'N/A',
              <button
                className="button"
                key={`${contractId}-ticker-edit-button`}
              >
                <PencilIcon width={20} height={20} fill="var(--text-white)" />
              </button>,
            ]}
            bgColor={'#1E1E1E'}
            textColor={'var(--text-white)'}
          />
          <RowItem
            details={[
              'Target ID:',
              targetId ? targetId : 'N/A',
              <button
                className="button"
                key={`${contractId}-targetId-edit-button`}
              >
                <PencilIcon width={20} height={20} fill="var(--text-white)" />
              </button>,
            ]}
            bgColor={'#1E1E1E'}
            textColor={'var(--text-white)'}
          />
          <RowItem
            details={[
              'ttlSeconds:',
              state?.records['@'].ttlSeconds
                ? state.records['@'].ttlSeconds
                : 'N/A',
              <button className="button" key={`${contractId}-ttl-edit-button`}>
                <PencilIcon width={20} height={20} fill="var(--text-white)" />
              </button>,
            ]}
            bgColor={'#1E1E1E'}
            textColor={'var(--text-white)'}
          />
          <RowItem
            details={[
              'Controller:',
              state?.controllers ? state.controllers : 'N/A',
              <button
                className="button"
                key={`${contractId}-controller-edit-button`}
              >
                <PencilIcon width={20} height={20} fill="var(--text-white)" />
              </button>,
            ]}
            bgColor={'#1E1E1E'}
            textColor={'var(--text-white)'}
          />
          <RowItem
            details={[
              'Undernames:',
              state?.records
                ? `${Object.keys(state.records).length - 1} / 100`
                : 'N/A',
              <button className="button" key={`${contractId}-records-button`}>
                <PencilIcon width={20} height={20} fill="var(--text-white)" />
              </button>,
            ]}
            bgColor={'#1E1E1E'}
            textColor={'var(--text-white)'}
          />
          <RowItem
            details={[
              'Owner:',
              state?.owner ? state.owner : 'N/A',
              <button
                className="assets-manage-button"
                key={`${contractId}-transfer-button`}
              >
                Transfer
              </button>,
            ]}
            bgColor={'#1E1E1E'}
            textColor={'var(--text-white)'}
          />
        </table>
      </div>
    </div>
  );
}

export default ManageAntModal;
