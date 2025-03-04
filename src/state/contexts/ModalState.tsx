import PrimaryNameModal from '@src/components/modals/PrimaryNameModal/PrimaryNameModal';
import UpgradeDomainsModal from '@src/components/modals/ant-management/UpgradeDomainsModal/UpgradeDomainsModal';
import { Dispatch, createContext, useContext, useReducer } from 'react';

import { ModalAction } from '../reducers/ModalReducer';

export type ModalState = {
  showUpgradeAntModal: boolean;
  showEditUndernameModal: boolean;
  showPrimaryNameModal: boolean;
};

export type ModalStateProviderProps = {
  reducer: React.Reducer<ModalState, ModalAction>;
  children: React.ReactNode;
};

export const initialModalState: ModalState = {
  showUpgradeAntModal: false,
  showEditUndernameModal: false,
  showPrimaryNameModal: false,
};

const ModalStateContext = createContext<[ModalState, Dispatch<ModalAction>]>([
  initialModalState,
  () => initialModalState,
]);

export const useModalState = (): [ModalState, Dispatch<ModalAction>] =>
  useContext(ModalStateContext);

/** Create provider to wrap app in */
export function ModalStateProvider({
  reducer,
  children,
}: ModalStateProviderProps): JSX.Element {
  const [modalStates, dispatchModalState] = useReducer(
    reducer,
    initialModalState,
  );

  return (
    <ModalStateContext.Provider value={[modalStates, dispatchModalState]}>
      {children}
      <UpgradeDomainsModal
        visible={modalStates.showUpgradeAntModal}
        setVisible={(b) =>
          dispatchModalState({
            type: 'setModalOpen',
            payload: { showUpgradeAntModal: b },
          })
        }
      />
      <PrimaryNameModal
        visible={modalStates.showPrimaryNameModal}
        setVisible={(b) =>
          dispatchModalState({
            type: 'setModalOpen',
            payload: { showPrimaryNameModal: b },
          })
        }
      />
    </ModalStateContext.Provider>
  );
}
