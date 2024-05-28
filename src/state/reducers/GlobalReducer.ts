import { ArIOReadable, ArIOWritable } from '@ar.io/sdk/web';

import { ArweaveCompositeDataProvider } from '../../services/arweave/ArweaveCompositeDataProvider';
import { GlobalState } from '../contexts/GlobalState';

export type GlobalAction =
  | {
      type: 'setGateway';
      payload: {
        gateway: string;
        provider: ArweaveCompositeDataProvider;
      };
    }
  | {
      type: 'setBlockHeight';
      payload: number;
    }
  | {
      type: 'setArIOContract';
      payload: ArIOWritable | ArIOReadable;
    }
  | {
      type: 'setIoTicker';
      payload: string;
    };

export const reducer = (
  state: GlobalState,
  action: GlobalAction,
): GlobalState => {
  switch (action.type) {
    case 'setGateway':
      return {
        ...state,
        gateway: action.payload.gateway,
        arweaveDataProvider: action.payload.provider,
      };
    case 'setBlockHeight':
      return {
        ...state,
        blockHeight: action.payload,
        lastBlockUpdateTimestamp: Date.now(),
      };
    case 'setIoTicker':
      return {
        ...state,
        ioTicker: action.payload,
      };
    case 'setArIOContract':
      return {
        ...state,
        arioContract: action.payload,
      };
    default:
      return state;
  }
};
