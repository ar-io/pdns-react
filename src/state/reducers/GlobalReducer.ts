import { ArweaveTransactionID } from '../../types';
import { ArweaveWalletConnector, PDNSContractJSON } from '../../types';
import { GlobalState } from '../contexts/GlobalState';

export type Action =
  | { type: 'setWalletAddress'; payload: ArweaveTransactionID | undefined }
  | {
      type: 'setWallet';
      payload: ArweaveWalletConnector | undefined;
    }
  | { type: 'setGateway'; payload: string }
  | { type: 'setPDNSContractState'; payload: PDNSContractJSON }
  | { type: 'setHeight'; payload: number };

export const reducer = (state: GlobalState, action: Action): GlobalState => {
  switch (action.type) {
    case 'setWalletAddress':
      return {
        ...state,
        walletAddress: action.payload,
      };
    case 'setWallet':
      return {
        ...state,
        wallet: action.payload,
      };
    case 'setGateway':
      return {
        ...state,
        gateway: action.payload,
      };
    case 'setHeight': {
      return {
        ...state,
        height: action.payload,
      };
    }
    case 'setPDNSContractState':
      return {
        ...state,
        pdnsSourceContract: action.payload,
      };
    default:
      return state;
  }
};
