import { useEffect, useState } from 'react';
import {
  createSearchParams,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import { useGlobalState } from '../../state/contexts/GlobalState';
import { useTransactionState } from '../../state/contexts/TransactionState';
import {
  BuyRecordPayload,
  INTERACTION_TYPES,
  TransactionData,
} from '../../types';
import {
  TRANSACTION_DATA_KEYS,
  generateAtomicState,
  isObjectOfTransactionPayloadType,
} from '../../utils';

export function useTransactionData() {
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const from = useLocation().state;
  const [{ walletAddress }] = useGlobalState();
  const [{ transactionData, interactionType, workflowStage }] =
    useTransactionState();

  const [data, setData] = useState<TransactionData>();

  /**
   * TODO: parse search params that are provided on initial page load and update the
   * transaction state with those values. That will allow users to dynamically link
   * transaction interactions.
   */

  useEffect(() => {
    if (!transactionData) {
      navigate(from ?? '/');
      return;
    }

    const updatedSearchParams = createSearchParams({
      // TODO: sanitize these values
      ...(transactionData as any),
      interactionType,
      workflowStage,
    });

    setSearchParams(updatedSearchParams);

    // if atomic registration detected, generate the state for it.
    if (
      walletAddress &&
      isObjectOfTransactionPayloadType<BuyRecordPayload>(
        transactionData,
        TRANSACTION_DATA_KEYS[INTERACTION_TYPES.BUY_RECORD].keys,
      ) &&
      transactionData.contractTxId === 'atomic'
    ) {
      setData({
        ...transactionData,
        state: generateAtomicState(transactionData.name, walletAddress),
      });
      return;
    }
    setData(transactionData);
  }, [transactionData, interactionType, workflowStage]);

  return {
    transactionData: data,
    interactionType,
    workflowStage,
  };
}

export default useTransactionData;
