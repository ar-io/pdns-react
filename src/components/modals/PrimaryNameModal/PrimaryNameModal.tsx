import { FundFrom } from '@ar.io/sdk';
import { TransactionDetails } from '@src/components/data-display/TransactionDetails/TransactionDetails';
import { Loader } from '@src/components/layout';
import ArweaveID, {
  ArweaveIdTypes,
} from '@src/components/layout/ArweaveID/ArweaveID';
import { useCostDetails } from '@src/hooks/useCostDetails';
import useDomainInfo from '@src/hooks/useDomainInfo';
import { usePrimaryName } from '@src/hooks/usePrimaryName';
import { ArweaveTransactionID } from '@src/services/arweave/ArweaveTransactionID';
import {
  useArNSState,
  useGlobalState,
  useTransactionState,
  useWalletState,
} from '@src/state';
import dispatchANTInteraction from '@src/state/actions/dispatchANTInteraction';
import { dispatchANTUpdate } from '@src/state/actions/dispatchANTUpdate';
import dispatchArIOInteraction from '@src/state/actions/dispatchArIOInteraction';
import {
  ANT_INTERACTION_TYPES,
  ARNS_INTERACTION_TYPES,
  ContractInteraction,
  PrimaryNameRequestPayload,
  RemovePrimaryNamesPayload,
} from '@src/types';
import { decodePrimaryName, encodePrimaryName } from '@src/utils';
import eventEmitter from '@src/utils/events';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowDown } from 'lucide-react';
import { useEffect, useState } from 'react';

import DialogModal from '../DialogModal/DialogModal';

/**
 * Three workflows
 * - set primary name
 * use ario contract to create request than approve the request, then verify the primary name
 * - set primary name when it will change the primary name
 * use ario contract to create the request then approve the request with the connected ant, then verify the primary name
 *  should show the comparison between the previous primary name and new primary name
 * - remove primary name
 * use the ant to remove the primary name
 *
 */

enum PRIMARY_NAME_WORKFLOWS {
  REQUEST = 'Set Primary Name',
  CHANGE = 'Change Primary Name',
  REMOVE = 'Remove Primary Name',
}

function isPrimaryNameRequest(
  payload: any,
): payload is PrimaryNameRequestPayload {
  return typeof payload?.name == 'string';
}

function isRemovePrimaryNamesPayload(
  payload: any,
): payload is RemovePrimaryNamesPayload {
  return (
    typeof payload?.names == 'object' &&
    Array.isArray(payload.names) &&
    payload.names.every((s: unknown) => typeof s === 'string') &&
    typeof payload?.arioProcessId == 'string'
  );
}

function PrimaryNameModal({
  visible,
  setVisible,
}: {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [{ arioProcessId, arioContract, aoClient, aoNetwork }] =
    useGlobalState();
  const [{ wallet, walletAddress }] = useWalletState();
  const { data: primaryNameData, isLoading: isLoadingPrimaryNameData } =
    usePrimaryName();

  const [{ transactionData }, dispatchTransactionState] = useTransactionState();
  const [, dispatchArNSState] = useArNSState();
  const [fundingSource, setFundingSource] = useState<FundFrom | undefined>(
    'balance',
  );
  const { data: costDetail } = useCostDetails({
    ...((transactionData ?? {}) as any),
    intent: 'Primary-Name-Request',
    fromAddress: walletAddress?.toString(),
    fundFrom: fundingSource,
  });

  const transactionPayload =
    isRemovePrimaryNamesPayload(transactionData) ||
    isPrimaryNameRequest(transactionData)
      ? transactionData
      : undefined;

  const targetName = isRemovePrimaryNamesPayload(transactionData)
    ? transactionData.names[0]
    : isPrimaryNameRequest(transactionData)
    ? transactionData.name
    : undefined;

  // if undername, pop the base name, else target name is ArNS name and can be used for querying domain info
  const baseName = targetName?.includes('_')
    ? targetName.split('_').pop()
    : targetName;

  const { data: domainData, isLoading: loadingDomain } = useDomainInfo({
    domain: baseName,
  });

  const isLoading = loadingDomain || isLoadingPrimaryNameData;

  const [workflow, setWorkflow] = useState<
    PRIMARY_NAME_WORKFLOWS | undefined
  >();

  useEffect(() => {
    if (isPrimaryNameRequest(transactionData) && primaryNameData == undefined) {
      setWorkflow(PRIMARY_NAME_WORKFLOWS.REQUEST);
    } else if (
      isPrimaryNameRequest(transactionData) &&
      primaryNameData !== undefined
    ) {
      setWorkflow(PRIMARY_NAME_WORKFLOWS.CHANGE);
    } else if (isRemovePrimaryNamesPayload(transactionData)) {
      setWorkflow(PRIMARY_NAME_WORKFLOWS.REMOVE);
    } else {
      setWorkflow(undefined);
    }
  }, [transactionData]);

  function closeModal() {
    dispatchTransactionState({ type: 'reset' });
    setVisible(false);
  }

  async function confirm() {
    try {
      if (isLoadingPrimaryNameData == true)
        throw new Error(
          'Wait for primary name data to load before using primary name workflow',
        );
      if (!wallet?.contractSigner || !walletAddress)
        throw new Error('Connect to perform Primary Name operations');

      if (!transactionPayload || !targetName)
        throw new Error('Unable to read transaction payload');

      if (!domainData?.processId) {
        throw new Error('Unable to locate ANT associated with primary name');
      }

      if (domainData.owner && domainData.owner !== walletAddress.toString()) {
        throw new Error(
          'Unable to set primary name as user is not owner of the name',
        );
      }
      let result: ContractInteraction;

      switch (workflow) {
        // change and set are the same workflows interactions-wise so we fall thru here
        case PRIMARY_NAME_WORKFLOWS.CHANGE:
        case PRIMARY_NAME_WORKFLOWS.REQUEST: {
          // ario contract and ant interactions
          result = await dispatchArIOInteraction({
            workflowName: ARNS_INTERACTION_TYPES.PRIMARY_NAME_REQUEST,
            signer: wallet.contractSigner,
            payload: {
              ...transactionPayload,

              name: encodePrimaryName(targetName),
              antProcessId: domainData.processId,
            },
            owner: walletAddress,
            arioContract: arioContract as any,
            processId: arioProcessId,
            fundFrom: fundingSource,
            dispatch: dispatchTransactionState,
          });

          break;
        }
        case PRIMARY_NAME_WORKFLOWS.REMOVE: {
          result = await dispatchANTInteraction({
            signer: wallet.contractSigner,
            owner: walletAddress.toString(),
            processId: domainData.processId,
            workflowName: ANT_INTERACTION_TYPES.REMOVE_PRIMARY_NAMES,
            payload: {
              arioProcessId: transactionPayload.arioProcessId,
              names: [encodePrimaryName(targetName)],
            },
            dispatchTransactionState,
            dispatchArNSState,
            ao: aoClient,
          });
          queryClient.resetQueries({
            queryKey: ['primary-name'],
            exact: false,
          });
          break;
        }
        default:
          throw new Error('Unable to identify primary name workflow');
      }
      if (result) {
        eventEmitter.emit('success', {
          message: (
            <div>
              <span>
                {workflow} completed with transaction ID:{' '}
                <ArweaveID
                  characterCount={8}
                  shouldLink={true}
                  type={ArweaveIdTypes.INTERACTION}
                  id={new ArweaveTransactionID(result.id)}
                />
              </span>
            </div>
          ),
          name: workflow,
        });
      }
      queryClient.resetQueries({
        queryKey: ['primary-name'],
        exact: false,
      });

      dispatchANTUpdate({
        processId: domainData.processId,
        dispatch: dispatchArNSState,
        aoNetwork: aoNetwork,
        walletAddress,
        queryClient,
      });

      closeModal();
    } catch (error) {
      eventEmitter.emit('error', error);
    }
  }

  if (!visible) return <></>;

  return (
    <div className="modal-container">
      <DialogModal
        title={
          <h2 className="white text-xl">
            {isRemovePrimaryNamesPayload(transactionData)
              ? 'Remove'
              : isPrimaryNameRequest(transactionData) && primaryNameData?.name
              ? 'Change'
              : 'Set'}{' '}
            Primary Name
          </h2>
        }
        body={
          isLoading ? (
            <div className="min-w-[350px] flex justify-center">
              <Loader message={'Loading Primary Name info, please wait'} />
            </div>
          ) : (
            <div className="flex flex-col white justify-center items-center w-full min-w-[350px]">
              <div className="flex flex-col w-full justify-center items-center gap-3">
                {isPrimaryNameRequest(transactionData) &&
                  primaryNameData?.name && (
                    <>
                      {' '}
                      <div className="flex flex-col gap-2 w-full">
                        <span className=" text-xl w-full text-center">
                          Current
                        </span>
                        <div
                          className={`border-dark-grey text-grey bg-background flex justify-center items-center border rounded p-3 px-8`}
                        >
                          {decodePrimaryName(primaryNameData.name)}
                        </div>
                      </div>
                      <ArrowDown className="w-[30px]" />
                    </>
                  )}
                <div className="flex flex-col gap-2 w-full">
                  <span className=" text-xl w-full text-center">
                    {isRemovePrimaryNamesPayload(transactionData)
                      ? 'Current'
                      : 'New'}
                  </span>
                  <div
                    className={
                      (isRemovePrimaryNamesPayload(transactionData)
                        ? 'border-error  text-error bg-error-thin'
                        : 'border-success  text-success bg-success-thin') +
                      ` flex justify-center items-center border rounded p-3 px-8`
                    }
                  >
                    {targetName && decodePrimaryName(targetName)}
                  </div>
                </div>
              </div>

              {/* transaction details */}
              <div className="flex flex-col w-full">
                {workflow !== PRIMARY_NAME_WORKFLOWS.REMOVE && (
                  <div className="flex w-full pt-10">
                    <TransactionDetails
                      details={{
                        intent: 'Primary-Name-Request',
                        ...((transactionData ?? {}) as any),
                        fromAddress: walletAddress?.toString(),
                      }}
                      fundingSourceCallback={(v) => setFundingSource(v)}
                    />
                  </div>
                )}
              </div>
            </div>
          )
        }
        onCancel={closeModal}
        onClose={closeModal}
        onNext={
          (!isLoading &&
            costDetail &&
            costDetail.fundingPlan!.shortfall === 0) ||
          workflow === PRIMARY_NAME_WORKFLOWS.REMOVE
            ? confirm
            : undefined
        }
        nextText="Confirm"
        cancelText="Cancel"
        footerClass="border-t-0"
      />
    </div>
  );
}

export default PrimaryNameModal;
