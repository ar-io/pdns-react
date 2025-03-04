import { ARIOWriteable, AoARIOWrite, FundFrom } from '@ar.io/sdk/web';
import { ANTCard } from '@src/components/cards';
import { TransactionDetails } from '@src/components/data-display/TransactionDetails/TransactionDetails';
import WorkflowButtons from '@src/components/inputs/buttons/WorkflowButtons/WorkflowButtons';
import { StepProgressBar } from '@src/components/layout/progress';
import PageLoader from '@src/components/layout/progress/PageLoader/PageLoader';
import { useIsMobile } from '@src/hooks';
import { useCostDetails } from '@src/hooks/useCostDetails';
import { dispatchArNSUpdate, useArNSState } from '@src/state';
import dispatchArIOInteraction from '@src/state/actions/dispatchArIOInteraction';
import { useGlobalState } from '@src/state/contexts/GlobalState';
import { useTransactionState } from '@src/state/contexts/TransactionState';
import { useWalletState } from '@src/state/contexts/WalletState';
import {
  ARNSMapping,
  ARNS_INTERACTION_TYPES,
  ArNSInteractionTypeToIntentMap,
  TransactionData,
  ValidInteractionType,
} from '@src/types';
import {
  getARNSMappingByInteractionType,
  getWorkflowStepsForInteraction,
} from '@src/utils';
import eventEmitter from '@src/utils/events';
import { StepProps } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getTransactionHeader } from './transaction-headers';

// page on route transaction/review
// on completion routes to transaction/complete
function TransactionReview() {
  const navigate = useNavigate();
  const [{ arioContract, arioProcessId, aoNetwork, aoClient }] =
    useGlobalState();
  const [, dispatchArNSState] = useArNSState();
  const [{ walletAddress, wallet }] = useWalletState();
  const [
    { workflowName, interactionType, transactionData, interactionResult },
    dispatchTransactionState,
  ] = useTransactionState();
  const isMobile = useIsMobile();
  const [antProps, setAntProps] = useState<ARNSMapping>();
  const [steps, setSteps] = useState<StepProps[] | undefined>(
    getWorkflowStepsForInteraction(interactionType),
  );
  const [header, setHeader] = useState<string | JSX.Element | undefined>(
    getTransactionHeader({
      workflowName: workflowName as ARNS_INTERACTION_TYPES,
    }),
  );

  const [fundingSource, setFundingSource] = useState<FundFrom | undefined>(
    'balance',
  );

  const costDetailsParams = {
    ...((transactionData ?? {}) as any),
    intent:
      ArNSInteractionTypeToIntentMap[workflowName as ARNS_INTERACTION_TYPES],
    fromAddress: walletAddress?.toString(),
    fundFrom: fundingSource,
    quantity: (transactionData as any)?.qty,
  };
  const { data: costDetail } = useCostDetails(costDetailsParams);

  useEffect(() => {
    if (!transactionData && !workflowName) {
      navigate('/');
      return;
    }
    setAntProps(
      getARNSMappingByInteractionType({
        interactionType: interactionType as ValidInteractionType,
        transactionData: {
          ...transactionData,
          deployedTransactionId: interactionResult?.id,
        } as any as TransactionData,
      }) as ARNSMapping,
    );

    setSteps(getWorkflowStepsForInteraction(interactionType));
    setHeader(
      getTransactionHeader({
        workflowName: workflowName as ARNS_INTERACTION_TYPES,
      }),
    );
  }, [
    transactionData,
    interactionResult,
    workflowName,
    interactionType,
    walletAddress,
  ]);

  useEffect(() => {
    if (interactionResult?.id) {
      navigate('/transaction/complete');
    }
  }, [interactionResult, navigate]);

  async function handleNext() {
    try {
      if (!(arioContract instanceof ARIOWriteable)) {
        throw new Error('Wallet must be connected to dispatch transactions.');
      }
      if (!transactionData || !workflowName) {
        throw new Error('Transaction data is missing');
      }

      if (!walletAddress) {
        throw new Error('Wallet address is missing');
      }
      // TODO: check that it's connected
      await dispatchArIOInteraction({
        arioContract: arioContract as AoARIOWrite,
        workflowName: workflowName as ARNS_INTERACTION_TYPES,
        payload: transactionData,
        owner: walletAddress,
        processId: arioProcessId,
        dispatch: dispatchTransactionState,
        signer: wallet?.contractSigner,
        ao: aoClient,
        scheduler: aoNetwork.ARIO.SCHEDULER,
        fundFrom: fundingSource,
      });
    } catch (error) {
      eventEmitter.emit('error', error);
    } finally {
      if (walletAddress) {
        dispatchArNSUpdate({
          dispatch: dispatchArNSState,
          arioProcessId,
          walletAddress,
          aoNetworkSettings: aoNetwork,
        });
      }
    }
  }

  if (!antProps) {
    return (
      <PageLoader loading={true} message={'Loading transaction data...'} />
    );
  }

  return (
    <div className="page">
      <div
        className="flex flex-column center"
        style={isMobile ? {} : { gap: '0px', maxWidth: '900px', width: '100%' }}
      >
        {steps && steps.length ? (
          <div
            className="flex flex-row"
            style={{
              marginBottom: '20px',
              width: '100%',
            }}
          >
            <StepProgressBar stage={3} stages={steps} />
          </div>
        ) : (
          <></>
        )}

        {typeof header === 'string' ? (
          <div
            className="flex flex-row text-large white font-bold center"
            style={{
              height: '100%',
              padding: '50px 0px',
              borderTop: steps?.length ? 'solid 1px var(--text-faded)' : '',
            }}
          >
            {header}
          </div>
        ) : (
          header
        )}
        <ANTCard
          {...antProps}
          bordered
          compact={true}
          overrides={{
            ...antProps.overrides,
            targetId: (transactionData as any)?.targetId?.toString(),
          }}
        />

        <div className="flex w-full pt-10 box-border">
          <TransactionDetails
            details={costDetailsParams}
            fundingSourceCallback={(v) => setFundingSource(v)}
          />
        </div>

        <div
          className="flex"
          style={{
            marginTop: 20,
            width: '100%',
            justifyContent: 'flex-end',
          }}
        >
          <WorkflowButtons
            onNext={
              !costDetail ||
              (costDetail.fundingPlan?.shortfall &&
                costDetail.fundingPlan?.shortfall > 0)
                ? undefined
                : () => handleNext()
            }
            onBack={() => navigate(-1)}
            backText={'Back'}
            nextText={'Confirm'}
            customBackStyle={{ fontSize: '.875rem', padding: '.625rem' }}
            customNextStyle={{
              width: '100px',
              fontSize: '.875rem',
              padding: '.625rem',
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default TransactionReview;
