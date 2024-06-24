import {
  AR_IO_CONTRACT_FUNCTIONS,
  AoIOWrite,
  AoMessageResult,
  ArconnectSigner,
  spawnANT,
} from '@ar.io/sdk/web';
import { ArweaveTransactionID } from '@src/services/arweave/ArweaveTransactionID';
import { TransactionAction } from '@src/state/reducers/TransactionReducer';
import { ARNS_INTERACTION_TYPES, ContractInteraction } from '@src/types';
import { generateAtomicState } from '@src/utils';
import { WRITE_OPTIONS } from '@src/utils/constants';
import eventEmitter from '@src/utils/events';
import { Dispatch } from 'react';

const LUA_CODE_TX_ID = 'c4-NodvKhnK6n0ztdHkCtqmVMNvBytB6bj0ZtSVjcCU';

/**
 *
 * @param arweaveCompositeProvider - Temporary while the ArIO sdk does not support certain interactions
 */
export default async function dispatchArIOInteraction({
  payload,
  workflowName,
  owner,
  arioContract,
  processId,
  dispatch,
  signer,
}: {
  payload: Record<string, any>;
  workflowName: ARNS_INTERACTION_TYPES;
  owner: ArweaveTransactionID;
  arioContract?: AoIOWrite;
  processId: ArweaveTransactionID;
  dispatch: Dispatch<TransactionAction>;
  signer?: ArconnectSigner;
}): Promise<ContractInteraction> {
  let result: AoMessageResult | undefined = undefined;
  let functionName;

  try {
    if (!arioContract) throw new Error('ArIO provider is not defined');
    if (!signer) throw new Error('signer is not defined');
    dispatch({
      type: 'setSigning',
      payload: true,
    });
    switch (workflowName) {
      case ARNS_INTERACTION_TYPES.BUY_RECORD: {
        const { name, type, years } = payload;
        let processId = payload.processId;

        if (payload.processId === 'atomic') {
          processId = await spawnANT({
            state: generateAtomicState(payload.name, owner, payload.targetId),
            signer: signer,
            luaCodeTxId: LUA_CODE_TX_ID,
          });
        }

        const buyRecordResult = await arioContract.buyRecord({
          name,
          type,
          years,
          processId: processId,
        });

        result = buyRecordResult;
        functionName = AR_IO_CONTRACT_FUNCTIONS.BUY_RECORD;
        break;
      }
      case ARNS_INTERACTION_TYPES.EXTEND_LEASE:
        result = await arioContract.extendLease(
          {
            name: payload.name,
            years: payload.years,
          },
          WRITE_OPTIONS,
        );
        functionName = AR_IO_CONTRACT_FUNCTIONS.EXTEND_RECORD;
        break;
      case ARNS_INTERACTION_TYPES.INCREASE_UNDERNAMES:
        result = await arioContract.increaseUndernameLimit(
          {
            name: payload.name,
            increaseCount: payload.qty,
          },
          WRITE_OPTIONS,
        );
        functionName = AR_IO_CONTRACT_FUNCTIONS.INCREASE_UNDERNAME_COUNT;
        break;
      default:
        throw new Error(`Unsupported workflow name: ${workflowName}`);
    }
  } catch (error) {
    eventEmitter.emit('error', error);
  } finally {
    dispatch({
      type: 'setSigning',
      payload: false,
    });
  }
  if (!result) {
    throw new Error('Failed to dispatch ArIO interaction');
  }

  if (!functionName) throw new Error('Failed to set workflow name');

  const interaction: ContractInteraction = {
    deployer: owner.toString(),
    processId: processId.toString(),
    id: result.id,
    payload: {
      ...payload,
      function: functionName,
    },
    type: 'interaction',
  };

  dispatch({
    type: 'setWorkflowName',
    payload: workflowName,
  });
  dispatch({
    type: 'setInteractionResult',
    payload: interaction,
  });
  return interaction;
}
