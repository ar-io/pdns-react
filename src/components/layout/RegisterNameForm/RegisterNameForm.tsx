import { useState } from 'react';

import { defaultDataProvider } from '../../../services/arweave';
import { useGlobalState } from '../../../state/contexts/GlobalState';
import { useRegistrationState } from '../../../state/contexts/RegistrationState';
import {
  ARNS_TXID_ENTRY_REGEX,
  ARNS_TXID_REGEX,
} from '../../../utils/constants';
import { isAntValid, tagsToObject } from '../../../utils/searchUtils';
import Dropdown from '../../inputs/Dropdown/Dropdown';
import UpgradeTier from '../UpgradeTier/UpgradeTier';
import './styles.css';

function RegisterNameForm() {
  const [{ domain, ttl, antID }, dispatchRegisterState] =
    useRegistrationState();

  const [{ arnsSourceContract }] = useGlobalState();

  const [isValidAnt, setIsValidAnt] = useState<boolean | undefined>(undefined);

  function reset() {
    setIsValidAnt(undefined);
    dispatchRegisterState({
      type: 'setAntID',
      payload: undefined,
    });
    dispatchRegisterState({
      type: 'setTTL',
      payload: 100,
    });
  }

  async function handleAntId(e: any) {
    e.preventDefault();
    const id = e.target.value.trim();

    try {
      if (id === '') {
        reset();
        return;
      }
      // if its a partial id set state and return
      if (ARNS_TXID_ENTRY_REGEX.test(id) && !ARNS_TXID_REGEX.test(id)) {
        setIsValidAnt(undefined);
        dispatchRegisterState({
          type: 'setAntID',
          payload: id,
        });
        return;
      }
      // advanced checking for confirmations and if the contract is a valid ANT contract
      if (!isAntValid(id, arnsSourceContract.approvedANTSourceCodeTxs)) {
        throw Error('Ant is not valid');
      }

      const dataProvider = defaultDataProvider();
      const state = await dataProvider.getContractState(id);
      if (state == undefined) {
        throw Error('ANT contract state is undefined');
      }

      const { controller, name, owner, ticker, records } = state;
      console.log({ controller, name, owner, ticker, records });
      dispatchRegisterState({
        type: 'setAntID',
        payload: id,
      });
      dispatchRegisterState({
        type: 'setControllers',
        payload: [controller],
      });
      dispatchRegisterState({
        type: 'setNickname',
        payload: name,
      });
      dispatchRegisterState({
        type: 'setOwner',
        payload: owner,
      });
      dispatchRegisterState({
        type: 'setTicker',
        payload: ticker,
      });
      dispatchRegisterState({
        type: 'setTargetID',
        payload: records['@'],
      });
      setIsValidAnt(true);

      return;
    } catch (Error) {
      console.error(Error);
      setIsValidAnt(false);
      return;
    }
  }

  return (
    <>
      <div className="register-name-modal center">
        <div className="section-header">{domain} is available!</div>
        <div className="section-header">Register Domain</div>
        <div className="register-inputs center">
          <div className="input-group center column">
            <input
              className="data-input center"
              type="text"
              placeholder="Enter an ANT ID"
              value={antID}
              onChange={(e) => handleAntId(e)}
              maxLength={43}
              style={
                isValidAnt && antID
                  ? { border: 'solid 2px var(--success-green)' }
                  : !isValidAnt && antID
                  ? { border: 'solid 2px var(--error-red)' }
                  : {}
              }
            />
          </div>
          <div className="input-group center">
            <Dropdown
              showSelected={true}
              showChevron={true}
              selected={`${ttl}secs`}
              setSelected={(value) =>
                dispatchRegisterState({ type: 'setTTL', payload: value })
              }
              options={{
                '100secs': 100,
                '200secs': 200,
                '300secs': 300,
                '400secs': 400,
                '500secs': 500,
                '600secs': 600,
                '700secs': 700,
                '800secs': 800,
              }}
            />
          </div>
        </div>
        <UpgradeTier />
      </div>
    </>
  );
}

export default RegisterNameForm;
