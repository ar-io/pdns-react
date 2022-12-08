import { useEffect, useState } from 'react';

import logo from '../../../../assets/images/logo/looped-winston-white.gif';
import { useRegistrationState } from '../../../state/contexts/RegistrationState';
import { FUN_FACTS } from '../../../utils/constants';
import { RegistrationProgress } from '../../inputs/progress';

function DeployRegistration() {
  const [{ stage }, dispatchRegisterState] = useRegistrationState();
  const [deployStage, setDeployStage] = useState(1);
  const [fact, setFact] = useState(FUN_FACTS[0]);

  const [pickDomain, setPickDomain] = useState('success');
  const [createAnANT, setCreateAnANT] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [complete, setComplete] = useState('');

  useEffect(() => {
    setTimeout(() => {
      if (deployStage === 1) {
        setDeployStage(2);
        setPickDomain('success');
        setCreateAnANT('pending');
        return;
      }
      if (deployStage === 2) {
        setDeployStage(3);
        setCreateAnANT('success');
        setRegisterName('pending');
        return;
      }
      if (deployStage === 3) {
        setDeployStage(4);
        setRegisterName('fail');
        setComplete('success');
        return;
      }
      if (deployStage === 4) {
        dispatchRegisterState({
          type: 'setStage',
          payload: stage + 1,
        });
      }
    }, 7000);
  }, [deployStage]);

  useEffect(() => {
    setTimeout(() => {
      setFact(FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length - 1)]);
    }, 10000);
  }, [fact]);

  return (
    <>
      <div className="flex-column center">
        <RegistrationProgress
          stages={{
            1: {
              title: 'Pick Domain',
              status: pickDomain,
            },
            2: {
              title: 'Create an ANT',
              status: createAnANT,
            },
            3: {
              title: 'Register Name',
              status: registerName,
            },
            4: {
              title: 'Complete',
              status: complete,
            },
          }}
          stage={deployStage}
        />
        <div className="flex-column center" style={{ gap: 0 }}>
          <img src={logo} alt="ar-io-logo" width={150} height={150} />
          <span className="text faded center">
            We are reserving your name. Please give us a few ~
          </span>
        </div>
        <span className="textMedium white center">{fact}</span>
      </div>
    </>
  );
}

export default DeployRegistration;
