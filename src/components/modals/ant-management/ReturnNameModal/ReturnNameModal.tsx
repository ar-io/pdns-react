import WarningCard from '@src/components/cards/WarningCard/WarningCard';
import ArweaveID, {
  ArweaveIdTypes,
} from '@src/components/layout/ArweaveID/ArweaveID';
import { ArweaveTransactionID } from '@src/services/arweave/ArweaveTransactionID';
import {
  dispatchArNSUpdate,
  useArNSState,
  useGlobalState,
  useTransactionState,
  useWalletState,
} from '@src/state';
import dispatchANTInteraction from '@src/state/actions/dispatchANTInteraction';
import { ANT_INTERACTION_TYPES } from '@src/types';
import eventEmitter from '@src/utils/events';
import { useQueryClient } from '@tanstack/react-query';
import { Checkbox } from 'antd';
import { TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import DialogModal from '../../DialogModal/DialogModal';

export function ReturnNameModal({
  show,
  setShow,
  processId,
  name,
}: {
  show: boolean;
  setShow: (b: boolean) => void;
  processId: string;
  name: string;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [{ arioProcessId, antAoClient, aoNetwork }] = useGlobalState();
  const [, dispatchArNSState] = useArNSState();
  const [{ signing }, dispatchTransactionState] = useTransactionState();
  const [{ wallet, walletAddress }] = useWalletState();

  const [accepted, setAccepted] = useState(false);

  async function handleReturn() {
    try {
      if (!wallet?.contractSigner) {
        throw new Error('No Wander Signer found');
      }
      if (!walletAddress) throw new Error('Must connect to release the ANT');

      const result = await dispatchANTInteraction({
        signer: wallet.contractSigner,
        payload: {
          name,
          arioProcessId,
        },
        processId,
        workflowName: ANT_INTERACTION_TYPES.RELEASE_NAME,
        dispatchTransactionState,
        dispatchArNSState,
        owner: walletAddress.toString(),
        ao: antAoClient,
      });
      eventEmitter.emit('success', {
        message: (
          <div>
            <span>
              Release Name completed with transaction ID:{' '}
              <ArweaveID
                characterCount={8}
                shouldLink={true}
                type={ArweaveIdTypes.INTERACTION}
                id={new ArweaveTransactionID(result.id)}
              />
            </span>
          </div>
        ),
        name: ANT_INTERACTION_TYPES.RELEASE_NAME,
      });

      queryClient.resetQueries({
        queryKey: ['domainInfo', name],
      });
      queryClient.resetQueries({
        queryKey: ['domainInfo', processId],
      });

      dispatchArNSUpdate({
        walletAddress: walletAddress,
        arioProcessId,
        dispatch: dispatchArNSState,
        aoNetworkSettings: aoNetwork,
      });
      setShow(false);
      navigate('/manage');
    } catch (error) {
      eventEmitter.emit('error', error);
    }
  }

  if (!show) return <></>;

  return (
    <div className="modal-container">
      <DialogModal
        title={<h1 className="text-xl text-white">Permanent Name Return</h1>}
        body={
          <div className="flex flex-col text-white max-w-[32rem] max-h-[40rem] gap-8 text-sm">
            <span>
              You are about to return your permanently registered name back to
              the protocol. Once completed:
            </span>
            <ul className="flex flex-col gap-2 pl-6 list-disc">
              <li>
                The name will enter the Return Initiated Dutch Auction process
                and become available for public re-registration.
              </li>
              <li>
                You will no longer have ownership or control over this name.
              </li>
              <li>
                If repurchased during the auction, you will receive a portion of
                the proceeds based on the outcome.
              </li>
            </ul>

            <WarningCard
              customIcon={<TriangleAlert size={'18px'} />}
              text={
                <div className="flex flex-row size-full">
                  <span>
                    Be sure that you no longer need this name or its associated
                    features before proceeding.{' '}
                    <span className="bold">This action is irreversible.</span>
                  </span>
                </div>
              }
            />
            <div className="flex flex-col gap-4">
              {' '}
              <span>Do you wish to continue with the name return?</span>
              <span
                className="flex flex-row text-grey items-center text-sm py-4"
                style={{ gap: '10px' }}
              >
                <Checkbox
                  rootClassName="accept-checkbox"
                  onChange={(checked) => setAccepted(checked.target.checked)}
                  value={accepted}
                />
                I understand that this action cannot be undone{' '}
              </span>
            </div>
          </div>
        }
        cancelText="Cancel"
        nextText="Confirm"
        onCancel={!signing ? () => setShow(false) : undefined}
        onClose={!signing ? () => setShow(false) : undefined}
        onNext={accepted ? () => handleReturn() : undefined}
        footerClass={'py-10'}
      />
    </div>
  );
}
