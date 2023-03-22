import { Dispatch, createContext, useContext, useReducer } from 'react';

import { ANTContract } from '../../services/arweave/AntContract';
import { ArweaveTransactionID, REGISTRATION_TYPES } from '../../types';
import { RegistrationAction } from '../reducers/RegistrationReducer';

export type RegistrationState = {
  registrationType: REGISTRATION_TYPES;
  resolvedTxID?: ArweaveTransactionID;
  domain?: string;
  leaseDuration: number;
  tier: number;
  antContract?: ANTContract;
  antID?: ArweaveTransactionID;
  fee: { ar: number; io: number };
  isRegistered: boolean;
  stage: number;
  isSearching: boolean;
};

export type RegistrationStateProviderProps = {
  reducer: React.Reducer<RegistrationState, RegistrationAction>;
  children: React.ReactNode;
};

export const initialRegistrationState: RegistrationState = {
  registrationType: REGISTRATION_TYPES.USE_EXISTING,
  resolvedTxID: undefined,
  domain: undefined,
  leaseDuration: 1,
  antContract: new ANTContract(),
  tier: 1,
  fee: { ar: 0, io: 0 },
  antID: undefined,
  isRegistered: false,
  stage: 0,
  isSearching: false,
};

const RegistrationStateContext = createContext<
  [RegistrationState, Dispatch<RegistrationAction>]
>([initialRegistrationState, () => initialRegistrationState]);

export const useRegistrationState = (): [
  RegistrationState,
  Dispatch<RegistrationAction>,
] => useContext(RegistrationStateContext);

/** Create provider to wrap app in */
export default function RegistrationStateProvider({
  reducer,
  children,
}: RegistrationStateProviderProps): JSX.Element {
  const [state, dispatchRegisterState] = useReducer(
    reducer,
    initialRegistrationState,
  );

  return (
    <RegistrationStateContext.Provider value={[state, dispatchRegisterState]}>
      {children}
    </RegistrationStateContext.Provider>
  );
}
