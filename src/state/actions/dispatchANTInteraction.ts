import {
  ANT,
  ARIO,
  AoClient,
  AoMessageResult,
  ContractSigner,
  createAoSigner,
  spawnANT,
} from '@ar.io/sdk/web';
import { TransactionAction } from '@src/state/reducers/TransactionReducer';
import { ANT_INTERACTION_TYPES, ContractInteraction } from '@src/types';
import { lowerCaseDomain, sleep } from '@src/utils';
import eventEmitter from '@src/utils/events';
import { queryClient } from '@src/utils/network';
import { Dispatch } from 'react';

export default async function dispatchANTInteraction({
  payload,
  workflowName,
  processId,
  signer,
  owner,
  dispatch,
  ao,
}: {
  payload: Record<string, any>;
  workflowName: ANT_INTERACTION_TYPES;
  signer: ContractSigner;
  owner: string;
  processId: string;
  dispatch: Dispatch<TransactionAction>;
  ao: AoClient;
}): Promise<ContractInteraction> {
  let result: AoMessageResult | undefined = undefined;
  const aoCongestedTimeout = setTimeout(
    () => {
      eventEmitter.emit('network:ao:congested', true);
    }, // if it is taking longer than 10 seconds, consider the network congested
    1000 * 10,
  );
  const antProcess = ANT.init({
    processId: processId,
    signer,
  });
  const dispatchSigningMessage = (message?: string) => {
    dispatch({
      type: 'setSigningMessage',
      payload: message,
    });
  };
  try {
    if (!antProcess) throw new Error('ANT provider is not defined');

    switch (workflowName) {
      case ANT_INTERACTION_TYPES.SET_NAME:
        dispatchSigningMessage('Setting Name, please wait...');
        result = await antProcess.setName({ name: payload.name });
        break;
      case ANT_INTERACTION_TYPES.SET_TARGET_ID:
        dispatchSigningMessage('Setting Target ID, please wait...');
        result = await antProcess.setRecord({
          undername: '@',
          transactionId: payload.transactionId,
          ttlSeconds: payload.ttlSeconds,
        });
        break;
      case ANT_INTERACTION_TYPES.SET_TTL_SECONDS:
        dispatchSigningMessage('Setting TTL Seconds, please wait...');
        result = await antProcess.setRecord({
          undername: '@',
          transactionId: payload.transactionId,
          ttlSeconds: payload.ttlSeconds,
        });
        break;
      case ANT_INTERACTION_TYPES.SET_TICKER:
        dispatchSigningMessage('Setting Ticker, please wait...');
        result = await antProcess.setTicker({ ticker: payload.ticker });
        break;
      case ANT_INTERACTION_TYPES.SET_CONTROLLER:
        dispatchSigningMessage('Setting Controller, please wait...');
        result = await antProcess.addController({
          controller: payload.controller,
        });
        break;
      case ANT_INTERACTION_TYPES.REMOVE_CONTROLLER:
        dispatchSigningMessage('Removing Controller, please wait...');
        result = await antProcess.removeController({
          controller: payload.controller,
        });
        break;
      case ANT_INTERACTION_TYPES.TRANSFER:
        dispatchSigningMessage('Transferring Ownership, please wait...');
        if (payload.arnsDomain && payload.arioProcessId) {
          dispatchSigningMessage(
            'Clearing Primary Names associated with ANT...',
          );
          await antProcess
            .removePrimaryNames({
              names: [payload.arnsDomain],
              arioProcessId: payload.arioProcessId,
            })
            .catch((e) => eventEmitter.emit('error', e));
          queryClient.resetQueries({ queryKey: ['primary-name'] });
        }
        result = await antProcess.transfer({ target: payload.target });

        break;
      case ANT_INTERACTION_TYPES.SET_RECORD:
        dispatchSigningMessage('Setting Undername, please wait...');
        result = await antProcess.setRecord({
          undername: lowerCaseDomain(payload.subDomain),
          transactionId: payload.transactionId,
          ttlSeconds: payload.ttlSeconds,
        });
        break;
      case ANT_INTERACTION_TYPES.EDIT_RECORD:
        dispatchSigningMessage('Editing Undername, please wait...');
        result = await antProcess.setRecord({
          undername: lowerCaseDomain(payload.subDomain),
          transactionId: payload.transactionId,
          ttlSeconds: payload.ttlSeconds,
        });
        break;
      case ANT_INTERACTION_TYPES.REMOVE_RECORD:
        dispatchSigningMessage('Removing Undername, please wait...');
        result = await antProcess.removeRecord({
          undername: lowerCaseDomain(payload.subDomain),
        });
        break;

      case ANT_INTERACTION_TYPES.RELEASE_NAME: {
        dispatchSigningMessage('Releasing ArNS Name, please wait...');
        const arioContract = ARIO.init({ processId: payload.arioProcessId });

        result = await antProcess.releaseName({
          name: payload.name,
          arioProcessId: payload.arioProcessId,
        });
        dispatchSigningMessage('Verifying Release, please wait...');
        const released = await arioContract
          .getArNSRecord({ name: payload.name })
          .catch((e: Error) => e);

        if (released instanceof Error) {
          throw new Error('Failed to release ArNS Name: ' + released.message);
        }
        break;
      }
      case ANT_INTERACTION_TYPES.REASSIGN_NAME: {
        let newAntProcessId = payload.newAntProcessId;
        if (!newAntProcessId) {
          dispatchSigningMessage('Spawning new ANT, please wait... 1/2');
          newAntProcessId = await spawnANT({
            ao,
            signer: createAoSigner(signer),
            state: payload.previousState,
            luaCodeTxId: payload.luaCodeTxId,
          });
        }
        dispatchSigningMessage(
          'Reassigning ArNS name, please wait... ' +
            (payload.newAntProcessId ? '' : '2/2'),
        );
        // for UX so the user sees the signing message
        await sleep(2000);
        result = await antProcess.reassignName({
          name: payload.name,
          arioProcessId: payload.arioProcessId,
          antProcessId: newAntProcessId,
        });
        break;
      }
      case ANT_INTERACTION_TYPES.SET_LOGO:
        dispatchSigningMessage('Setting Logo, please wait...');
        result = await antProcess.setLogo({
          txId: payload.logo,
        });
        break;
      case ANT_INTERACTION_TYPES.SET_DESCRIPTION:
        dispatchSigningMessage('Setting Description, please wait...');
        result = await antProcess.setDescription({
          description: payload.description,
        });
        break;
      case ANT_INTERACTION_TYPES.SET_KEYWORDS:
        dispatchSigningMessage('Setting Keywords, please wait...');
        result = await antProcess.setKeywords({
          keywords: payload.keywords,
        });
        break;
      case ANT_INTERACTION_TYPES.APPROVE_PRIMARY_NAME:
        dispatchSigningMessage(
          'Approving Primary Name request, please wait...',
        );
        result = await antProcess.approvePrimaryNameRequest({
          name: payload.name,
          address: owner.toString(),
          arioProcessId: payload.arioProcessId,
        });
        break;
      case ANT_INTERACTION_TYPES.REMOVE_PRIMARY_NAMES:
        dispatchSigningMessage('Removing Primary Name, please wait...');

        result = await antProcess.removePrimaryNames({
          names: payload.names,
          arioProcessId: payload.arioProcessId,
        });
        break;

      default:
        throw new Error(`Unsupported workflow name: ${workflowName}`);
    }
  } catch (error) {
    eventEmitter.emit('error', error);
  } finally {
    dispatchSigningMessage(undefined);
    clearTimeout(aoCongestedTimeout);
  }
  if (!result) {
    throw new Error('Failed to dispatch ANT interaction');
  }

  const interaction: ContractInteraction = {
    deployer: owner,
    processId: processId.toString(),
    id: result.id,
    type: 'interaction',
    payload,
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
