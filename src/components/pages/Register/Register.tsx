import { CheckCircleFilled } from '@ant-design/icons';
import { ANT, AOProcess, mARIOToken } from '@ar.io/sdk/web';
import Tooltip from '@src/components/Tooltips/Tooltip';
import { Accordion } from '@src/components/data-display';
import { useCostDetails } from '@src/hooks/useCostDetails';
import { ValidationError } from '@src/utils/errors';
import emojiRegex from 'emoji-regex';
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { useIsFocused, useRegistrationStatus } from '../../../hooks';
import { ArweaveTransactionID } from '../../../services/arweave/ArweaveTransactionID';
import { useGlobalState } from '../../../state/contexts/GlobalState';
import { useRegistrationState } from '../../../state/contexts/RegistrationState';
import { useTransactionState } from '../../../state/contexts/TransactionState';
import { useWalletState } from '../../../state/contexts/WalletState';
import {
  ARNS_INTERACTION_TYPES,
  BuyRecordPayload,
  TRANSACTION_TYPES,
  VALIDATION_INPUT_TYPES,
} from '../../../types';
import {
  encodeDomainToASCII,
  formatDate,
  isArweaveTransactionID,
} from '../../../utils';
import {
  MAX_LEASE_DURATION,
  MIN_LEASE_DURATION,
} from '../../../utils/constants';
import eventEmitter from '../../../utils/events';
import Counter from '../../inputs/Counter/Counter';
import WorkflowButtons from '../../inputs/buttons/WorkflowButtons/WorkflowButtons';
import NameTokenSelector from '../../inputs/text/NameTokenSelector/NameTokenSelector';
import ValidationInput from '../../inputs/text/ValidationInput/ValidationInput';
import Loader from '../../layout/Loader/Loader';
import TransactionCost from '../../layout/TransactionCost/TransactionCost';
import { StepProgressBar } from '../../layout/progress';
import PageLoader from '../../layout/progress/PageLoader/PageLoader';
import './styles.css';

function RegisterNameForm() {
  const [
    { domain, leaseDuration, registrationType, antID, targetId },
    dispatchRegisterState,
  ] = useRegistrationState();
  const { data: costDetails } = useCostDetails({
    intent: 'Buy-Name',
    name: domain,
    type: registrationType,
    years: leaseDuration,
  });
  const [{ arweaveDataProvider, arioTicker, arioProcessId, antAoClient }] =
    useGlobalState();
  const [{ walletAddress, balances }] = useWalletState();
  const [, dispatchTransactionState] = useTransactionState();
  const { name } = useParams();
  const { loading: isValidatingRegistration } = useRegistrationStatus(
    name ?? domain,
  );
  const [newTargetId, setNewTargetId] = useState<string>();
  const targetIdFocused = useIsFocused('target-id-input');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [hasValidationErrors, setHasValidationErrors] =
    useState<boolean>(false);
  const [validatingNext, setValidatingNext] = useState<boolean>(false);

  useEffect(() => {
    const redirect = searchParams.get('redirect');
    if (redirect && name) {
      if (!balances[arioTicker]) return;
      setSearchParams();
      handleNext();
      return;
    }
  }, [balances]);

  useEffect(() => {
    if (name && domain !== name) {
      dispatchRegisterState({
        type: 'setDomainName',
        payload: name,
      });
    }
  }, [name, domain]);

  async function handleANTId(id?: ArweaveTransactionID) {
    if (!id) {
      dispatchRegisterState({
        type: 'setANTID',
        payload: undefined,
      });
      return;
    }
    dispatchRegisterState({
      type: 'setANTID',
      payload: id,
    });

    const contract = ANT.init({
      process: new AOProcess({
        processId: id.toString(),
        ao: antAoClient,
      }),
    });
    if (!contract) throw new Error('Contract not found');
  }

  if (!registrationType) {
    return <Loader size={80} />;
  }

  async function handleNext() {
    try {
      // validate transaction cost, return if insufficient balance and emit validation message
      if (!walletAddress) {
        const redirectParams = new URLSearchParams({ redirect: 'true' });
        navigate('/connect', {
          state: {
            to: `/register/${domain}?${redirectParams.toString()}`,
            from: `/register/${domain}`,
          },
        });
        return;
      }

      setValidatingNext(true);

      if (hasValidationErrors) {
        throw new ValidationError(
          'Please fix the errors above before continuing.',
        );
      }
    } catch (error: any) {
      eventEmitter.emit('error', error);
      setValidatingNext(false);
      return;
    } finally {
      setValidatingNext(false);
    }

    const name =
      domain && emojiRegex().test(domain)
        ? encodeDomainToASCII(domain)
        : domain;
    const buyRecordPayload: BuyRecordPayload = {
      name,
      processId: antID?.toString() ?? 'atomic',
      // TODO: move this to a helper function
      years:
        registrationType === TRANSACTION_TYPES.LEASE
          ? leaseDuration
          : undefined,
      type: registrationType,
      targetId,
    };

    dispatchTransactionState({
      type: 'setTransactionData',
      payload: {
        assetId: arioProcessId,
        functionName: 'buyRecord',
        ...buyRecordPayload,
        interactionPrice: costDetails?.tokenCost,
      },
    });
    dispatchTransactionState({
      type: 'setInteractionType',
      payload: ARNS_INTERACTION_TYPES.BUY_RECORD,
    });
    dispatchRegisterState({
      type: 'reset',
    });
    dispatchTransactionState({
      type: 'setWorkflowName',
      payload: ARNS_INTERACTION_TYPES.BUY_RECORD,
    });
    // navigate to the transaction page, which will load the updated state of the transaction context
    navigate('/transaction/review', {
      state: `/register/${domain}`,
    });
  }

  return (
    <div className="page center">
      <PageLoader
        message={'Loading Domain info, please wait.'}
        loading={isValidatingRegistration}
      />
      <div
        className="flex flex-column flex-center"
        style={{
          maxWidth: '900px',
          width: '100%',
          padding: '0px',

          gap: '50px',
          boxSizing: 'border-box',
        }}
      >
        <div
          className="flex flex-row flex-center"
          style={{
            paddingBottom: '20px',
            borderBottom: 'solid 1px var(--text-faded)',
          }}
        >
          <StepProgressBar
            stages={[
              { title: 'Choose', description: 'Pick a name', status: 'finish' },
              {
                title: 'Configure',
                description: 'Registration Period',
                status: 'process',
              },
              {
                title: 'Confirm',
                description: 'Review transaction',
                status: 'wait',
              },
            ]}
            stage={1}
          />
        </div>

        <span
          className="text-medium white center"
          style={{ fontWeight: '500px', fontSize: '23px', gap: '15px' }}
        >
          <span style={{ color: 'var(--success-green)' }}>
            {domain} <span className={'white'}>is available!</span>
          </span>{' '}
          <CheckCircleFilled
            style={{ fontSize: '20px', color: 'var(--success-green)' }}
          />
        </span>
        <div className="flex flex-column flex-center">
          <div
            className="flex flex-column flex-center"
            style={{
              width: '100%',
              height: 'fit-content',
              gap: '15px',
            }}
          >
            <div
              className="flex flex-row flex-space-between"
              style={{ gap: '25px' }}
            >
              <button
                className="flex flex-row center text-medium font-bold cursor-pointer"
                onClick={() =>
                  dispatchRegisterState({
                    type: 'setRegistrationType',
                    payload: TRANSACTION_TYPES.LEASE,
                  })
                }
                style={{
                  position: 'relative',
                  background:
                    registrationType === TRANSACTION_TYPES.LEASE
                      ? 'var(--text-white)'
                      : '',
                  color:
                    registrationType === TRANSACTION_TYPES.LEASE
                      ? 'var(--text-black)'
                      : 'var(--text-white)',
                  border: 'solid 2px var(--text-faded)',
                  borderRadius: 'var(--corner-radius)',
                  height: '56px',
                  borderBottomWidth: '0.5px',
                }}
              >
                Lease{' '}
                {registrationType === TRANSACTION_TYPES.LEASE ? (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-6px',
                      left: '50%',
                      transform: 'rotate(45deg)',
                      width: '11px',
                      height: '11px',
                      background: 'var(--text-white)',
                    }}
                  ></div>
                ) : (
                  <></>
                )}
              </button>
              <button
                className="flex flex-row center text-medium font-bold cursor-pointer"
                style={{
                  position: 'relative',
                  background:
                    registrationType === TRANSACTION_TYPES.BUY
                      ? 'var(--text-white)'
                      : '',
                  color:
                    registrationType === TRANSACTION_TYPES.BUY
                      ? 'var(--text-black)'
                      : 'var(--text-white)',
                  border: 'solid 2px var(--text-faded)',
                  borderRadius: 'var(--corner-radius)',
                  height: '56px',
                  borderBottomWidth: '0.5px',
                }}
                onClick={() =>
                  dispatchRegisterState({
                    type: 'setRegistrationType',
                    payload: TRANSACTION_TYPES.BUY,
                  })
                }
              >
                Buy{' '}
                {registrationType === TRANSACTION_TYPES.BUY ? (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -6,
                      left: '50%',
                      transform: 'rotate(45deg)',
                      width: '11px',
                      height: '11px',
                      background: 'var(--text-white)',
                    }}
                  ></div>
                ) : (
                  <></>
                )}
              </button>
            </div>

            <div
              className="flex flex-column flex-center card"
              style={{
                width: '100%',
                minHeight: '0px',
                height: 'fit-content',
                maxWidth: 'unset',
                padding: '25px',
                boxSizing: 'border-box',
                borderTopWidth: '0.2px',
                borderRadius: 'var(--corner-radius)',
                justifyContent: 'flex-start',
              }}
            >
              {registrationType === TRANSACTION_TYPES.LEASE ? (
                <Counter
                  value={leaseDuration}
                  setValue={(v: number) => {
                    dispatchRegisterState({
                      type: 'setLeaseDuration',
                      payload: v,
                    });
                  }}
                  // TODO: move this to a helper function
                  minValue={MIN_LEASE_DURATION}
                  maxValue={MAX_LEASE_DURATION}
                  valueStyle={{ padding: '20px 120px' }}
                  valueName={leaseDuration > 1 ? 'years' : 'year'}
                  detail={`Until ${formatDate(
                    Date.now() + leaseDuration * 365 * 24 * 60 * 60 * 1000,
                  )}`}
                  title={
                    <span
                      className="white"
                      style={{
                        padding: '0px 10px 10px 10px',
                        fontWeight: '500',
                      }}
                    >{`Registration period (between ${MIN_LEASE_DURATION}-${MAX_LEASE_DURATION} years)`}</span>
                  }
                />
              ) : registrationType === TRANSACTION_TYPES.BUY ? (
                <div
                  className="flex flex-column flex-center"
                  style={{ gap: '1em' }}
                >
                  <span className="text-medium grey center">
                    Registration Period
                  </span>
                  <span className="text-medium white center">Permanent</span>
                </div>
              ) : (
                <></>
              )}
            </div>
          </div>
          <div className="flex flex-column" style={{ gap: '1em' }}>
            <Accordion
              title={<span className="text-medium">Advanced Options</span>}
              key="1"
            >
              <div className="flex flex-column" style={{ gap: '1em' }}>
                <div
                  className="name-token-input-wrapper"
                  style={{
                    border:
                      targetIdFocused || newTargetId
                        ? 'solid 1px var(--text-white)'
                        : 'solid 1px var(--text-faded)',
                    position: 'relative',
                  }}
                >
                  <ValidationInput
                    inputId={'target-id-input'}
                    value={newTargetId ?? ''}
                    setValue={(v: string) => {
                      setNewTargetId(v.trim());
                      if (isArweaveTransactionID(v.trim())) {
                        dispatchRegisterState({
                          type: 'setTargetId',
                          payload: new ArweaveTransactionID(v.trim()),
                        });
                      }
                      if (v.trim().length === 0) {
                        setHasValidationErrors(false);
                      }
                    }}
                    wrapperCustomStyle={{
                      width: '100%',
                      hieght: '45px',
                      borderRadius: '0px',
                      backgroundColor: 'var(--card-bg)',
                      boxSizing: 'border-box',
                    }}
                    inputClassName={`white name-token-input`}
                    inputCustomStyle={{
                      paddingLeft: '10px',
                      background: 'transparent',
                    }}
                    maxCharLength={43}
                    placeholder={'Arweave Transaction ID (Target ID)'}
                    validationPredicates={{
                      [VALIDATION_INPUT_TYPES.ARWEAVE_ID]: {
                        fn: (id: string) =>
                          arweaveDataProvider.validateArweaveId(id),
                      },
                    }}
                    showValidationChecklist={false}
                    showValidationIcon={true}
                    validityCallback={(validity: boolean) => {
                      setHasValidationErrors(!validity);
                    }}
                  />

                  <span
                    className="flex flex-row text grey flex-center"
                    style={{
                      width: 'fit-content',
                      height: 'fit-content',
                      wordBreak: 'keep-all',
                      // padding: '1px',
                    }}
                  >
                    <Tooltip message="The Target ID is the Arweave Transaction ID that will be resolved at the root of this ArNS name" />
                  </span>
                </div>
                <NameTokenSelector
                  selectedTokenCallback={(id) => handleANTId(id)}
                />
              </div>
            </Accordion>

            <TransactionCost
              ioRequired={true}
              fee={{
                [arioTicker]: costDetails?.tokenCost
                  ? new mARIOToken(costDetails.tokenCost).toARIO().valueOf()
                  : undefined,
              }}
              feeWrapperStyle={{
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
              }}
            />
            <div style={{ marginTop: '0px' }}>
              <WorkflowButtons
                nextText="Next"
                backText="Back"
                onNext={validatingNext ? undefined : handleNext}
                onBack={() => navigate('/', { state: `/register/${domain}` })}
                customBackStyle={{ fontSize: '.875rem', padding: '.625rem' }}
                customNextStyle={{
                  width: '100px',
                  fontSize: '.875rem',
                  padding: '.625rem',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterNameForm;
