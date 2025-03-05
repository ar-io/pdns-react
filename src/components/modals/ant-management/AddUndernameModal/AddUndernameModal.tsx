import { AoArNSNameData } from '@ar.io/sdk/web';
import { useArNSRegistryDomains } from '@src/hooks/useArNSRegistryDomains';
import { Tooltip } from 'antd';
import { useEffect, useRef, useState } from 'react';

import { useIsMobile } from '../../../../hooks';
import { SetRecordPayload, VALIDATION_INPUT_TYPES } from '../../../../types';
import {
  isArweaveTransactionID,
  isUndernameValid,
  validateNoLeadingOrTrailingDashes,
  validateNoSpecialCharacters,
  validateTTLSeconds,
} from '../../../../utils';
import {
  ARNS_TX_ID_ENTRY_REGEX,
  LANDING_PAGE_TXID,
  MAX_TTL_SECONDS,
  MAX_UNDERNAME_LENGTH,
  MIN_TTL_SECONDS,
  UNDERNAME_REGEX,
} from '../../../../utils/constants';
import eventEmitter from '../../../../utils/events';
import WarningCard from '../../../cards/WarningCard/WarningCard';
import ValidationInput from '../../../inputs/text/ValidationInput/ValidationInput';
import DialogModal from '../../DialogModal/DialogModal';

function AddUndernameModal({
  antId,
  closeModal,
  payloadCallback,
}: {
  antId: string; // process ID if asset type is a contract interaction
  closeModal: () => void;
  payloadCallback: (payload: SetRecordPayload) => void;
}) {
  const { data: registeredDomains } = useArNSRegistryDomains();
  const isMobile = useIsMobile();

  const targetIdRef = useRef<HTMLInputElement>(null);
  const ttlRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [undername, setUndername] = useState<string>('');
  const [targetId, setTargetId] = useState<string>(
    LANDING_PAGE_TXID.toString(),
  );
  const [ttlSeconds, setTtlSeconds] = useState<number>(MIN_TTL_SECONDS);
  const [associatedRecords, setAssociatedRecords] = useState<
    Record<string, AoArNSNameData>
  >({});
  const [maxUndernameLength, setMaxUndernameLength] =
    useState<number>(MAX_UNDERNAME_LENGTH);

  useEffect(() => {
    if (registeredDomains) {
      const arnsRecords = Object.entries(registeredDomains).reduce(
        (acc: Record<string, AoArNSNameData>, [name, record]) => {
          if (record.processId == antId.toString()) {
            acc[name] = record;
          }
          return acc;
        },
        {},
      );
      loadDetails({ arnsRecords });
    }
    nameRef.current?.focus();
  }, [antId.toString(), registeredDomains]);

  async function loadDetails({
    arnsRecords,
  }: {
    arnsRecords: Record<string, AoArNSNameData>;
  }) {
    try {
      setAssociatedRecords(arnsRecords);
      const shortestAssociatedName = Object.keys(arnsRecords).length
        ? Math.min(...Object.keys(arnsRecords).map((name) => name.length))
        : 0;
      setMaxUndernameLength(MAX_UNDERNAME_LENGTH - shortestAssociatedName);
    } catch (error) {
      eventEmitter.emit('error', error);
    }
  }

  function handlePayloadCallback() {
    payloadCallback({
      subDomain: undername,
      transactionId: targetId,
      ttlSeconds,
    });
  }

  function getIncompatibleNames(
    undername: string,
    records: Record<string, AoArNSNameData>,
  ): string[] {
    return Object.keys(records).filter(
      (name: string) => undername.length + name.length > MAX_UNDERNAME_LENGTH,
    );
  }

  return (
    <div
      className="modal-container"
      style={isMobile ? { padding: 'none' } : {}}
    >
      {/**modal header */}
      <DialogModal
        title={<h2 className="white text-xl">Add Undername</h2>}
        body={
          <form>
            <div
              className="flex flex-column"
              style={{ fontSize: '14px', width: '500px' }}
            >
              <div
                className="flex flex-column"
                style={{ paddingBottom: '30px' }}
              >
                <div className="flex flex-col gap-2">
                  <span className="grey">Undername:</span>
                  <span
                    className="flex flex-row"
                    style={{ position: 'relative' }}
                  >
                    <ValidationInput
                      key={'undername'}
                      ref={nameRef}
                      inputClassName="name-token-input white"
                      inputCustomStyle={{
                        paddingLeft: '10px',
                        fontSize: '14px',
                        paddingRight: '80px',
                      }}
                      wrapperCustomStyle={{
                        width: '100%',
                        border: '1px solid var(--text-faded)',
                        borderRadius: 'var(--corner-radius)',
                      }}
                      showValidationIcon={true}
                      showValidationOutline={true}
                      showValidationChecklist={true}
                      validationListStyle={{ display: 'none' }}
                      value={undername}
                      setValue={(v: string) => setUndername(v)}
                      catchInvalidInput={false}
                      maxCharLength={maxUndernameLength}
                      customPattern={UNDERNAME_REGEX}
                      validationPredicates={{
                        [VALIDATION_INPUT_TYPES.UNDERNAME]: {
                          fn: (name: string) =>
                            validateNoSpecialCharacters(name),
                        },
                        'Dashes and Underscores cannot be leading or trailing':
                          {
                            fn: (name) =>
                              validateNoLeadingOrTrailingDashes(name),
                          },
                      }}
                    />
                    <span
                      className="flex flex-row grey"
                      style={{
                        position: 'absolute',
                        top: '0px',
                        bottom: '0px',
                        right: undername.length ? '35px' : '10px',
                        width: 'fit-content',
                      }}
                    >
                      {undername.length} / {maxUndernameLength}
                    </span>
                  </span>
                  {getIncompatibleNames(undername, associatedRecords).length ? (
                    <WarningCard
                      text={
                        <span>
                          This ANT has{' '}
                          <Tooltip
                            title={
                              <div
                                className="flex flex-column"
                                style={{
                                  padding: '5px',
                                  gap: '5px',
                                  boxSizing: 'border-box',
                                }}
                              >
                                {getIncompatibleNames(
                                  undername,
                                  associatedRecords,
                                ).map((name) => (
                                  <span key={name}>{name}</span>
                                ))}
                              </div>
                            }
                            color="var(--card-bg)"
                            placement="top"
                            showArrow={true}
                          >
                            <span className="underline font-bold">
                              {
                                getIncompatibleNames(
                                  undername,
                                  associatedRecords,
                                ).length
                              }{' '}
                              name
                              {getIncompatibleNames(
                                undername,
                                associatedRecords,
                              ).length > 1
                                ? 's'
                                : ''}
                            </span>
                          </Tooltip>{' '}
                          that will not support this undername as it is over
                          their supported length.
                        </span>
                      }
                    />
                  ) : (
                    <></>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <span className="grey">Target ID:</span>
                  <ValidationInput
                    key={'targetId'}
                    ref={targetIdRef}
                    inputClassName="name-token-input white"
                    inputCustomStyle={{
                      paddingLeft: '10px',
                      fontSize: '14px',
                      paddingRight: '40px',
                    }}
                    wrapperCustomStyle={{
                      position: 'relative',
                      border: '1px solid var(--text-faded)',
                      borderRadius: 'var(--corner-radius)',
                    }}
                    showValidationIcon={true}
                    showValidationOutline={true}
                    showValidationChecklist={true}
                    validationListStyle={{ display: 'none' }}
                    maxCharLength={43}
                    value={targetId}
                    setValue={setTargetId}
                    catchInvalidInput={true}
                    customPattern={ARNS_TX_ID_ENTRY_REGEX}
                    validationPredicates={{
                      [VALIDATION_INPUT_TYPES.ARWEAVE_ID]: {
                        fn: async (id: string) => {
                          if (!isArweaveTransactionID(id)) {
                            throw new Error('Invalid Arweave ID');
                          }
                          return true;
                        },
                      },
                    }}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="grey">TTL:</span>
                  <ValidationInput
                    key={'ttlSeconds'}
                    ref={ttlRef}
                    inputClassName="name-token-input white"
                    inputCustomStyle={{ paddingLeft: '10px', fontSize: '14px' }}
                    wrapperCustomStyle={{
                      position: 'relative',
                      border: '1px solid var(--text-faded)',
                      borderRadius: 'var(--corner-radius)',
                      maxWidth: '130px',
                    }}
                    showValidationIcon={true}
                    showValidationOutline={true}
                    showValidationChecklist={true}
                    type="number"
                    minNumber={MIN_TTL_SECONDS}
                    maxNumber={MAX_TTL_SECONDS}
                    validationListStyle={{ display: 'none' }}
                    maxCharLength={MAX_TTL_SECONDS.toString().length}
                    value={ttlSeconds}
                    setValue={(v: string) => setTtlSeconds(+v)}
                    catchInvalidInput={true}
                    customPattern={
                      new RegExp(
                        `^[0-9]{1,${MAX_TTL_SECONDS.toString().length}}$`,
                      )
                    }
                    validationPredicates={{
                      [VALIDATION_INPUT_TYPES.VALID_TTL]: {
                        fn: (ttl: string) => validateTTLSeconds(+ttl),
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          </form>
        }
        onCancel={closeModal}
        onClose={closeModal}
        onNext={
          isArweaveTransactionID(targetId) &&
          isUndernameValid(undername) &&
          ttlSeconds >= MIN_TTL_SECONDS &&
          ttlSeconds <= MAX_TTL_SECONDS
            ? () => handlePayloadCallback()
            : undefined
        }
        footer={
          <div className="flex">
            {/* <TransactionCost
              fee={{}}
              feeWrapperStyle={{ alignItems: 'flex-start' }}
              showBorder={false}
            /> */}
          </div>
        }
        nextText="Next"
        cancelText="Cancel"
      />
    </div>
  );
}

export default AddUndernameModal;
