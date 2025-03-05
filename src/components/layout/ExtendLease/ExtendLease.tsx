import {
  AoArNSLeaseData,
  isLeasedArNSRecord,
  mARIOToken,
} from '@ar.io/sdk/web';
import { useCostDetails } from '@src/hooks/useCostDetails';
import useDomainInfo from '@src/hooks/useDomainInfo';
import Lottie from 'lottie-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { ArweaveTransactionID } from '../../../services/arweave/ArweaveTransactionID';
import { useGlobalState } from '../../../state/contexts/GlobalState';
import { useTransactionState } from '../../../state/contexts/TransactionState';
import { useWalletState } from '../../../state/contexts/WalletState';
import {
  ARNS_INTERACTION_TYPES,
  ExtendLeasePayload,
  TRANSACTION_TYPES,
} from '../../../types';
import {
  formatDate,
  getLeaseDurationFromEndTimestamp,
  lowerCaseDomain,
} from '../../../utils';
import {
  MAX_LEASE_DURATION,
  MIN_LEASE_DURATION,
  YEAR_IN_MILLISECONDS,
} from '../../../utils/constants';
import { InfoIcon } from '../../icons';
import arioLoading from '../../icons/ario-spinner.json';
import Counter from '../../inputs/Counter/Counter';
import WorkflowButtons from '../../inputs/buttons/WorkflowButtons/WorkflowButtons';
import DialogModal from '../../modals/DialogModal/DialogModal';
import TransactionCost from '../TransactionCost/TransactionCost';

function ExtendLease() {
  // TODO: remove use of source contract
  const [{ arioTicker, arioProcessId }] = useGlobalState();
  const [{ walletAddress }] = useWalletState();

  const [, dispatchTransactionState] = useTransactionState();
  const location = useLocation();
  const navigate = useNavigate();
  const name = location.pathname.split('/').at(-2);
  const { data: domainData, isLoading: loadingDomainData } = useDomainInfo({
    domain: name,
  });
  const leasedArnsRecord = domainData?.arnsRecord as
    | undefined
    | AoArNSLeaseData;

  const [registrationType, setRegistrationType] = useState<TRANSACTION_TYPES>(
    TRANSACTION_TYPES.LEASE,
  );
  const [newLeaseDuration, setNewLeaseDuration] = useState<number>(1);
  const [maxIncrease, setMaxIncrease] = useState<number>(0);
  const { data: costDetails, isLoading: loadingCostDetails } = useCostDetails(
    registrationType === 'permabuy'
      ? {
          intent: 'Upgrade-Name',
          name: name as string,
          fundFrom: 'any',
          fromAddress: walletAddress?.toString(),
        }
      : {
          fromAddress: walletAddress?.toString(),
          intent: 'Extend-Lease',
          years: newLeaseDuration,
          type: registrationType?.toString() as any,
          name: name as string,
          fundFrom: 'any',
        },
  );
  const arioFee = costDetails?.tokenCost
    ? new mARIOToken(costDetails.tokenCost).toARIO().valueOf()
    : undefined;

  const hasInsufficientFunds = costDetails?.fundingPlan
    ? costDetails.fundingPlan.shortfall > 0
    : true;

  useEffect(() => {
    if (!name) {
      navigate(`/manage/names`);
      return;
    }
    if (domainData?.arnsRecord) {
      setRegistrationType(domainData.arnsRecord?.type as TRANSACTION_TYPES);

      if (!isLeasedArNSRecord(domainData?.arnsRecord)) {
        setRegistrationType(TRANSACTION_TYPES.BUY);
        setMaxIncrease(0);
        return;
      } else {
        setMaxIncrease(
          Math.max(
            0,
            MAX_LEASE_DURATION -
              getLeaseDurationFromEndTimestamp(
                domainData.arnsRecord.startTimestamp,
                domainData.arnsRecord.endTimestamp,
              ),
          ),
        );
      }
    }
  }, [name, domainData]);

  if (domainData?.arnsRecord && !isLeasedArNSRecord(domainData.arnsRecord)) {
    return (
      <div className="page center">
        <DialogModal
          showClose={false}
          cancelText="Manage"
          body={
            <span
              className="flex flex-column white center"
              style={{
                height: '100%',
              }}
            >
              This domain is permanently registered and its lease cannot be
              extended.
            </span>
          }
        />
      </div>
    );
  }

  return (
    <div className="page center">
      <div className="flex flex-column" style={{ maxWidth: '1000px' }}>
        <div
          className="flex flex-row center"
          style={{ justifyContent: 'space-between' }}
        >
          <h1 className="white text-[2rem]">Extend Lease</h1>

          <div
            className="flex flex-row center white"
            style={{
              border: 'solid 1px var(--text-faded)',
              borderRadius: 'var(--corner-radius)',
              gap: '8px',
              width: 'fit-content',
              padding: '12px',
            }}
          >
            <InfoIcon width={'22px'} height={'22px'} fill="var(--text-grey)" />
            Expiring on{' '}
            {leasedArnsRecord?.endTimestamp
              ? formatDate(leasedArnsRecord.endTimestamp)
              : 'N/A'}
          </div>
        </div>{' '}
        <div
          className="flex flex-row flex-space-between"
          style={{ gap: '25px' }}
        >
          <button
            className="flex flex-row center text-medium font-bold cursor-pointer"
            onClick={() => setRegistrationType(TRANSACTION_TYPES.LEASE)}
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
            Extend Lease{' '}
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
            className="flex flex-row center text-medium bold cursor-pointer"
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
            onClick={() => setRegistrationType(TRANSACTION_TYPES.BUY)}
          >
            Permanently Buy{' '}
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
        <div className="flex flex-col relative p-[30px] w-full h-[200px] bg-foreground box-border rounded-md items-center justify-center ">
          {registrationType === TRANSACTION_TYPES.LEASE ? (
            <>
              {' '}
              {/* loading overlay */}
              {loadingDomainData && (
                <div className="flex flex-col items-center justify-center rounded-md bg-foreground h-full w-full absolute top-0 left-0">
                  <div className="flex flex-row items-center justify-center">
                    <Lottie
                      animationData={arioLoading}
                      loop={true}
                      className="h-[150px]"
                    />
                  </div>
                </div>
              )}
              {/* maxxed out duration overlay */}
              {!loadingDomainData && maxIncrease < 1 && (
                <div className="flex flex-col center  rounded-md  bg-[rgb(0,0,0,0.5)] h-full w-full absolute top-0 left-0">
                  <div className="flex flex-row items-center justify-center max-w-fit h-fit rounded-md border border-error text-white bg-foreground p-6 gap-2">
                    {' '}
                    <InfoIcon
                      width={'24px'}
                      height={'24px'}
                      fill="var(--error-red)"
                    />
                    <span className="center">
                      Maximum lease extension reached
                    </span>
                  </div>
                </div>
              )}
              <Counter
                setValue={setNewLeaseDuration}
                value={newLeaseDuration}
                maxValue={maxIncrease}
                minValue={MIN_LEASE_DURATION}
                valueName={newLeaseDuration > 1 ? 'years' : 'year'}
                valueStyle={{ padding: '10px 80px' }}
                detail={
                  <span>
                    until{' '}
                    {leasedArnsRecord?.endTimestamp
                      ? formatDate(
                          leasedArnsRecord?.endTimestamp +
                            newLeaseDuration * YEAR_IN_MILLISECONDS,
                        )
                      : 'N/A'}
                  </span>
                }
                title={
                  <span
                    className="white"
                    style={{ padding: '0px 10px 10px 10px', fontWeight: '500' }}
                  >{`Extension Duration ( up to ${Math.max(
                    1,
                    maxIncrease,
                  )} year${maxIncrease > 1 ? 's' : ''} )`}</span>
                }
              />
            </>
          ) : (
            <div
              className="flex flex-column flex-center"
              style={{ gap: '1em' }}
            >
              <span className="text-medium grey center">
                Registration Period
              </span>
              <span className="text-medium white center">Permanent</span>
            </div>
          )}
        </div>
        {/* TODO: [PE-4563] implement contract read api for extend record */}
        <TransactionCost
          feeWrapperStyle={{
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
          fee={
            loadingCostDetails
              ? { [arioTicker]: undefined }
              : {
                  [arioTicker]:
                    maxIncrease < 1 &&
                    registrationType === TRANSACTION_TYPES.LEASE
                      ? 0
                      : arioFee,
                }
          }
          ioRequired={true}
        />
        <WorkflowButtons
          backText="Cancel"
          nextText="Continue"
          customNextStyle={{
            background:
              maxIncrease < 1 &&
              registrationType === TRANSACTION_TYPES.LEASE &&
              'var(--text-grey)',
            color:
              maxIncrease < 1 &&
              registrationType === TRANSACTION_TYPES.LEASE &&
              'var(--text-white)',
          }}
          onBack={() => {
            navigate(`/manage/names/${lowerCaseDomain(name!)}`);
          }}
          onNext={
            !arioFee || arioFee <= 0 || hasInsufficientFunds
              ? undefined
              : () => {
                  if (
                    registrationType === TRANSACTION_TYPES.LEASE &&
                    domainData?.arnsRecord &&
                    name
                  ) {
                    const payload: ExtendLeasePayload = {
                      name,
                      years: newLeaseDuration,
                      processId: new ArweaveTransactionID(
                        domainData?.arnsRecord.processId,
                      ),
                    };

                    dispatchTransactionState({
                      type: 'setInteractionType',
                      payload: ARNS_INTERACTION_TYPES.EXTEND_LEASE,
                    });
                    dispatchTransactionState({
                      type: 'setWorkflowName',
                      payload: ARNS_INTERACTION_TYPES.EXTEND_LEASE,
                    });
                    dispatchTransactionState({
                      type: 'setTransactionData',
                      payload: {
                        assetId: arioProcessId,
                        functionName: 'extendRecord',
                        ...payload,
                        arnsRecord: domainData.arnsRecord,
                        interactionPrice: arioFee,
                      },
                    });
                  } else if (domainData?.arnsRecord && name) {
                    dispatchTransactionState({
                      type: 'setInteractionType',
                      payload: ARNS_INTERACTION_TYPES.UPGRADE_NAME,
                    });
                    dispatchTransactionState({
                      type: 'setWorkflowName',
                      payload: ARNS_INTERACTION_TYPES.UPGRADE_NAME,
                    });
                    dispatchTransactionState({
                      type: 'setTransactionData',
                      payload: {
                        assetId: arioProcessId,
                        functionName: 'upgradeName',
                        name,
                        processId: new ArweaveTransactionID(
                          domainData.arnsRecord.processId,
                        ),

                        arnsRecord: domainData.arnsRecord,
                        interactionPrice: arioFee,
                      },
                    });
                  }

                  navigate('/transaction/review', {
                    state: `/manage/names/${lowerCaseDomain(name!)}/extend`,
                  });
                }
          }
          detail={
            hasInsufficientFunds ? (
              <div
                className="flex flex-row center"
                style={{
                  width: 'fit-content',
                  height: 'fit-content',
                  borderRadius: 'var(--corner-radius)',
                  border: 'solid 1px var(--error-red)',
                  background: '#1D1314',
                  padding: '8px',
                  boxSizing: 'border-box',
                  color: 'var(--error-red)',
                  gap: '10px',
                  whiteSpace: 'nowrap',
                  fontSize: '13px',
                }}
              >
                <InfoIcon
                  width={'24px'}
                  height={'24px'}
                  fill="var(--error-red)"
                />
                <span className="center">Insufficient funds.</span>
              </div>
            ) : (
              <></>
            )
          }
        />{' '}
      </div>
    </div>
  );
}

export default ExtendLease;
