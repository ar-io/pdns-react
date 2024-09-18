import { ANTCard } from '@src/components/cards';
import { TransferANTModal } from '@src/components/modals';
import ConfirmTransactionModal from '@src/components/modals/ConfirmTransactionModal/ConfirmTransactionModal';
import { ArweaveTransactionID } from '@src/services/arweave/ArweaveTransactionID';
import { ANT_INTERACTION_TYPES, ContractInteraction } from '@src/types';
import eventEmitter from '@src/utils/events';
import { Skeleton } from 'antd';
import { useState } from 'react';

import DomainSettingsRow from './DomainSettingsRow';

export default function OwnerRow({
  confirm,
  processId,
  owner,
  associatedNames,
  editable = false,
}: {
  processId: string;
  owner: string;
  associatedNames: string[];
  confirm: ({ target }: { target: string }) => Promise<ContractInteraction>;
  editable?: boolean;
}) {
  const [payload, setTransactionData] = useState<{
    target: ArweaveTransactionID;
    associatedNames?: string[];
  }>();
  const [showTransferANTModal, setShowTransferANTModal] =
    useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  async function handleTransferANT(payload: { target: ArweaveTransactionID }) {
    try {
      await confirm({ target: payload.target.toString() });
    } catch (error) {
      eventEmitter.emit('error', error);
    } finally {
      setShowConfirmModal(false);
    }
  }

  return (
    <>
      <DomainSettingsRow
        label="Owner:"
        value={owner ?? <Skeleton.Input active />}
        editable={editable}
        action={[
          <button
            key={1}
            onClick={() => setShowTransferANTModal(true)}
            className="px-3 py-[5px] rounded-[4px] bg-primary-thin hover:bg-primary border hover:border-primary border-primary-thin text-primary hover:text-black transition-all"
          >
            Transfer
          </button>,
        ]}
      />
      {showTransferANTModal && (
        <TransferANTModal
          closeModal={() => setShowTransferANTModal(false)}
          antId={new ArweaveTransactionID(processId)}
          associatedNames={associatedNames}
          payloadCallback={(payload) => {
            setTransactionData({
              target: new ArweaveTransactionID(payload.target.toString()),
              associatedNames: payload.associatedNames,
            });
            setShowConfirmModal(true);
            setShowTransferANTModal(false);
          }}
        />
      )}
      {showConfirmModal && payload && (
        <ConfirmTransactionModal
          cancel={() => setShowConfirmModal(false)}
          confirm={() => handleTransferANT(payload)}
          interactionType={ANT_INTERACTION_TYPES.TRANSFER}
          content={
            <span className="flex" style={{ maxWidth: '500px' }}>
              <ANTCard
                domain={payload.associatedNames?.[0] ?? ''}
                mobileView
                processId={new ArweaveTransactionID(processId)}
                overrides={{
                  'New Owner': payload.target.toString(),
                }}
                compact={false}
                disabledKeys={[
                  'maxUndernames',
                  'owner',
                  'controller',
                  'ttlSeconds',
                ]}
              />
            </span>
          }
        />
      )}
    </>
  );
}
