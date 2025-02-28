import { AoArNSNameData, ArNSEventEmitter } from '@ar.io/sdk/web';
import { AoAddress } from '@src/types';

import {
  ANTProcessData,
  ArNSState,
  initialArNSState,
} from '../contexts/ArNSState';

export type ArNSAction =
  | { type: 'setArNSEmitter'; payload: ArNSEventEmitter }
  | { type: 'setDomains'; payload: Record<string, AoArNSNameData> }
  | { type: 'addDomains'; payload: Record<string, AoArNSNameData> }
  | {
      type: 'setAnts';
      payload: Record<string, ANTProcessData>;
    }
  | {
      type: 'addAnts';
      payload: Record<string, ANTProcessData>;
    }
  | { type: 'setAntCount'; payload: number }
  | { type: 'incrementAntCount' }
  | { type: 'setLoading'; payload: boolean }
  | { type: 'setPercentLoaded'; payload?: number }
  | { type: 'reset' }
  | { type: 'refresh'; payload: AoAddress };

export const arnsReducer = (
  state: ArNSState,
  action: ArNSAction,
): ArNSState => {
  switch (action.type) {
    case 'setDomains':
      return {
        ...state,
        domains: action.payload,
      };
    case 'setArNSEmitter':
      return {
        ...state,
        arnsEmitter: action.payload,
      };
    case 'addDomains':
      return {
        ...state,
        domains: { ...state.domains, ...action.payload },
      };
    case 'setAnts':
      return {
        ...state,
        ants: action.payload,
      };
    case 'addAnts':
      return {
        ...state,
        ants: { ...state.ants, ...action.payload },
      };
    case 'setAntCount':
      return {
        ...state,
        antCount: action.payload,
      };
    case 'incrementAntCount':
      return {
        ...state,
        antCount: state.antCount + 1,
      };
    case 'setLoading':
      return {
        ...state,
        loading: action.payload,
      };
    case 'setPercentLoaded':
      return {
        ...state,
        percentLoaded: action.payload
          ? Math.round((state.antCount / action.payload) * 100)
          : 0,
      };
    case 'reset': {
      return initialArNSState;
    }
    case 'refresh': {
      state.arnsEmitter.fetchProcessesOwnedByWallet({
        address: action.payload.toString(),
      });

      return {
        ...state,
        loading: true,
        percentLoaded: 0,
        antCount: 0,
        ants: {},
        domains: {},
      };
    }

    default:
      return state;
  }
};
