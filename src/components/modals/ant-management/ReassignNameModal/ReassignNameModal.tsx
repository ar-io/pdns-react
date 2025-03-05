import { SpawnANTState } from '@ar.io/sdk';
import WarningCard from '@src/components/cards/WarningCard/WarningCard';
import RadioGroup from '@src/components/inputs/RadioGroup';
import ValidationInput from '@src/components/inputs/text/ValidationInput/ValidationInput';
import ArweaveID, {
  ArweaveIdTypes,
} from '@src/components/layout/ArweaveID/ArweaveID';
import useDomainInfo from '@src/hooks/useDomainInfo';
import { ArweaveTransactionID } from '@src/services/arweave/ArweaveTransactionID';
import {
  dispatchArNSUpdate,
  useArNSState,
  useGlobalState,
  useTransactionState,
  useWalletState,
} from '@src/state';
import dispatchANTInteraction from '@src/state/actions/dispatchANTInteraction';
import { ANT_INTERACTION_TYPES, VALIDATION_INPUT_TYPES } from '@src/types';
import {
  encodeDomainToASCII,
  isArweaveTransactionID,
  isEthAddress,
  isValidAoAddress,
} from '@src/utils';
import {
  ARNS_TX_ID_ENTRY_REGEX,
  DEFAULT_ANT_LUA_ID,
} from '@src/utils/constants';
import eventEmitter from '@src/utils/events';
import { useQueryClient } from '@tanstack/react-query';
import { Checkbox, Skeleton } from 'antd';
import { TriangleAlert, XIcon } from 'lucide-react';
import { useState } from 'react';

import DialogModal from '../../DialogModal/DialogModal';

enum REASSIGN_NAME_WORKFLOWS {
  EXISTING = 'Use Existing ANT',
  NEW_BLANK = 'New with blank slate configuration.',
  NEW_EXISTING = 'New with existing configuration.',
  REVIEW = 'Review Reassignment',
}

export function ReassignNameModal({
  show,
  setShow,
  processId,
  name,
}: {
  show: boolean;
  setShow: (b: boolean) => void;
  processId: string;
  name: string;
}) {
  const queryClient = useQueryClient();
  const [{ arioProcessId, aoClient, aoNetwork }] = useGlobalState();
  const [, dispatchArNSState] = useArNSState();
  const [{ signing }, dispatchTransactionState] = useTransactionState();
  const [{ wallet, walletAddress }] = useWalletState();

  const { data: domainData } = useDomainInfo({ domain: name });
  const [workflow, setWorkflow] = useState<REASSIGN_NAME_WORKFLOWS | undefined>(
    undefined,
  );
  const [newAntProcessId, setNewAntProcessId] = useState<string>('');
  const { data: newAntInfo, isLoading: loadingNewAntInfo } = useDomainInfo(
    isArweaveTransactionID(newAntProcessId)
      ? {
          antId: newAntProcessId,
        }
      : {},
  );

  const [antType, setAntType] = useState<
    | REASSIGN_NAME_WORKFLOWS.NEW_BLANK
    | REASSIGN_NAME_WORKFLOWS.NEW_EXISTING
    | REASSIGN_NAME_WORKFLOWS.EXISTING
  >(REASSIGN_NAME_WORKFLOWS.NEW_BLANK);
  const [accepted, setAccepted] = useState<boolean>(false);

  function handleClose() {
    setWorkflow(undefined);
    setNewAntProcessId('');
    setShow(false);
  }

  async function handleReassign() {
    try {
      if (!wallet?.contractSigner) {
        throw new Error('No Wander Signer found');
      }
      if (!walletAddress)
        throw new Error('Must connect to Reassign the domain');
      if (!domainData?.info || !domainData?.state)
        throw new Error('Unable to get domain data');

      const previousState: SpawnANTState = {
        controllers: domainData.controllers,
        records: domainData.records,
        owner: walletAddress.toString(),
        ticker: domainData.info.Ticker,
        name: domainData.info.Name,
        description: domainData.info.Description,
        keywords: domainData.info.Keywords,
        balances: domainData.state.Balances,
      };

      const result = await dispatchANTInteraction({
        signer: wallet.contractSigner,
        payload: {
          name,
          arioProcessId,
          // if we provide newAntProcessId it will skip spawning the ant and ignore previousState
          newAntProcessId:
            antType === REASSIGN_NAME_WORKFLOWS.EXISTING
              ? newAntProcessId
              : undefined,
          previousState:
            antType === REASSIGN_NAME_WORKFLOWS.NEW_BLANK
              ? undefined
              : previousState,
          luaCodeTxId: DEFAULT_ANT_LUA_ID,
        },
        processId,
        workflowName: ANT_INTERACTION_TYPES.REASSIGN_NAME,
        dispatchTransactionState,
        dispatchArNSState,
        owner: walletAddress.toString(),
        ao: aoClient,
      });
      eventEmitter.emit('success', {
        message: (
          <div>
            <span>
              Reassign Name completed with transaction ID:{' '}
              <ArweaveID
                characterCount={8}
                shouldLink={true}
                type={ArweaveIdTypes.INTERACTION}
                id={new ArweaveTransactionID(result.id)}
              />
            </span>
          </div>
        ),
        name: ANT_INTERACTION_TYPES.REASSIGN_NAME,
      });

      queryClient.resetQueries({
        queryKey: ['domainInfo', name],
      });
      queryClient.resetQueries({
        queryKey: ['domainInfo', processId],
      });

      dispatchArNSUpdate({
        walletAddress: walletAddress,
        arioProcessId,
        dispatch: dispatchArNSState,
        aoNetworkSettings: aoNetwork,
      });
      handleClose();
    } catch (error) {
      eventEmitter.emit('error', error);
    }
  }

  if (!show) return <></>;

  if (!workflow) {
    return (
      <div className="modal-container">
        <div className="flex flex-col rounded-md border border-dark-grey bg-[#1B1B1D] p-6 w-[32rem] gap-8 text-white">
          <div className="flex flex-row justify-between items-center">
            <h2 className="text-xl">Name Reassignment</h2>
            <button onClick={() => handleClose()}>
              <XIcon className="text-white size-5" />
            </button>
          </div>
          <span className="text-sm">
            You are about to reassign your name registration from one ANT
            (Arweave Name Token) to another.
          </span>
          <div className="flex flex-row w-full items-center justify-center text-sm">
            <button
              className="bg-primary-thin p-3 rounded"
              onClick={() => setWorkflow(REASSIGN_NAME_WORKFLOWS.NEW_EXISTING)}
            >
              Create new ANT
            </button>
            <button
              className="bg-primary-thin p-3 rounded"
              onClick={() => setWorkflow(REASSIGN_NAME_WORKFLOWS.EXISTING)}
            >
              Use existing ANT
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (workflow === REASSIGN_NAME_WORKFLOWS.REVIEW) {
    return (
      <div className="modal-container">
        <DialogModal
          title={<h1 className="text-2xl text-white">Name Reassignment</h1>}
          body={
            <div className="flex flex-col gap-8 w-[32rem] pb-8">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                  <span className=" text-grey">Name</span>
                  <span className=" text-white">
                    {encodeDomainToASCII(name)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className=" text-grey">Old ANT Process ID</span>
                  <span className=" text-white">
                    {domainData?.processId ? (
                      <ArweaveID
                        id={new ArweaveTransactionID(domainData.processId)}
                        type={ArweaveIdTypes.CONTRACT}
                        shouldLink
                      />
                    ) : (
                      'N/A'
                    )}
                  </span>
                </div>

                <div className="flex flex-col  gap-1">
                  <span className=" text-grey">New ANT Type</span>
                  <span className=" text-white">{antType}</span>
                </div>

                {antType === REASSIGN_NAME_WORKFLOWS.EXISTING && (
                  <>
                    <div className="flex flex-col  gap-1">
                      <span className=" text-grey">Destination Process ID</span>
                      <span className=" text-white">
                        <ArweaveID
                          id={new ArweaveTransactionID(newAntProcessId)}
                          type={ArweaveIdTypes.CONTRACT}
                          shouldLink
                        />
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 w-full">
                      <span className=" text-grey">Destination ANT Owner</span>
                      {loadingNewAntInfo ? (
                        <Skeleton.Input
                          size="small"
                          className="w-full bg-[rgb(255,255,255,0.05)] rounded"
                          active
                          style={{
                            width: '100%',
                          }}
                        />
                      ) : (
                        <span className=" text-white">
                          {newAntInfo && isValidAoAddress(newAntInfo?.owner) ? (
                            <ArweaveID
                              id={new ArweaveTransactionID(newAntInfo.owner)}
                              type={ArweaveIdTypes.ADDRESS}
                              shouldLink
                              linkStyle={{
                                color:
                                  newAntInfo?.owner !==
                                  walletAddress?.toString()
                                    ? '#FFD688BF'
                                    : '#6c97b5',
                              }}
                            />
                          ) : (
                            <span className="text-error">No Owner found!</span>
                          )}
                        </span>
                      )}
                    </div>

                    {newAntInfo?.owner !== walletAddress?.toString() && (
                      <WarningCard
                        customIcon={<TriangleAlert size={'18px'} />}
                        wrapperStyle={{ border: 'none' }}
                        text={
                          'This is not the same wallet you are logged-in with.'
                        }
                      />
                    )}
                  </>
                )}

                {antType === REASSIGN_NAME_WORKFLOWS.NEW_EXISTING && (
                  <>
                    <div className="flex flex-col  gap-1">
                      <span className=" text-grey">Controllers</span>
                      <div className="flex gap-3  text-white">
                        {domainData && domainData.controllers ? (
                          domainData.controllers.map((c, index) => {
                            if (isValidAoAddress(c)) {
                              return (
                                <ArweaveID
                                  key={index}
                                  id={
                                    isEthAddress(c)
                                      ? c
                                      : new ArweaveTransactionID(c)
                                  }
                                  shouldLink={isArweaveTransactionID(c)}
                                  type={ArweaveIdTypes.ADDRESS}
                                  characterCount={
                                    domainData.controllers.length > 1
                                      ? 8
                                      : undefined
                                  }
                                  wrapperStyle={{
                                    width: 'fit-content',
                                    whiteSpace: 'nowrap',
                                  }}
                                />
                              );
                            } else return c;
                          })
                        ) : (
                          <Skeleton.Input
                            size="small"
                            className="w-full bg-[rgb(255,255,255,0.05)] rounded"
                            active
                            style={{
                              width: '100%',
                            }}
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col  gap-1">
                      <span className="text-grey">Target ID</span>
                      <span className="text-white">
                        {domainData?.apexRecord.transactionId ? (
                          <ArweaveID
                            id={
                              new ArweaveTransactionID(
                                domainData.apexRecord.transactionId,
                              )
                            }
                            type={ArweaveIdTypes.TRANSACTION}
                            shouldLink
                          />
                        ) : (
                          <Skeleton.Input
                            size="small"
                            className="w-full bg-[rgb(255,255,255,0.05)] rounded"
                            active
                            style={{
                              width: '100%',
                            }}
                          />
                        )}
                      </span>
                    </div>
                    <div className="flex flex-col  gap-1">
                      <span className=" text-grey">Undernames</span>
                      <span className=" text-white">
                        {domainData?.undernameCount ?? (
                          <Skeleton.Input
                            size="small"
                            className="w-full bg-[rgb(255,255,255,0.05)] rounded"
                            active
                            style={{
                              width: '100%',
                            }}
                          />
                        )}
                      </span>
                    </div>
                  </>
                )}
                <span className="text-white">
                  This action cannot be undone. Do you wish to continue with the
                  reassignment?
                </span>
                <span
                  className={`flex flex-row ${accepted ? 'white' : 'grey'}`}
                  style={{
                    gap: 10,
                    alignItems: 'center',
                  }}
                >
                  <Checkbox
                    rootClassName="accept-checkbox"
                    onChange={(e) => setAccepted(e.target.checked)}
                    checked={accepted}
                    style={{ color: 'white' }}
                    disabled={
                      !isArweaveTransactionID(newAntProcessId) &&
                      antType === REASSIGN_NAME_WORKFLOWS.EXISTING
                    }
                  />
                  I understand that this action cannot be undone.
                </span>
              </div>
            </div>
          }
          cancelText="Back"
          nextText="Confirm"
          onCancel={() => {
            setWorkflow(antType);
          }}
          onClose={!signing ? () => handleClose() : undefined}
          onNext={
            ((isArweaveTransactionID(newAntProcessId) && !loadingNewAntInfo) ||
              antType !== REASSIGN_NAME_WORKFLOWS.EXISTING) &&
            accepted
              ? () => handleReassign()
              : undefined
          }
          footerClass={'py-11'}
        />
      </div>
    );
  }

  return (
    <div className="modal-container">
      <DialogModal
        title={<h1 className="text-2xl text-white">Name Reassignment</h1>}
        body={
          workflow === REASSIGN_NAME_WORKFLOWS.EXISTING ? (
            <div className="flex flex-col text-white max-w-[32rem] max-h-[40rem] gap-8 pb-4">
              <span>
                You are about to reassign your name registration from one ANT
                (Arweave Name Token) to another. Once completed:
              </span>
              <ul className="flex flex-col pl-6 list-disc gap-2">
                <li>
                  Ownership of the name will be fully reassigned to the new ANT.
                </li>
                <li>
                  The name&apos;s existing purchase type and undername
                  allocation will remain as-is.
                </li>
                <li>Associated controllers will not be carried over.</li>
                <li>
                  Associated undername configurations and data pointers will
                  also not be carried over.
                </li>
              </ul>

              <div className="flex flex-col gap-4">
                <span className="grey">Enter destination ANT Process ID:</span>
                <ValidationInput
                  inputClassName="name-token-input white"
                  inputCustomStyle={{ paddingLeft: '10px', fontSize: '16px' }}
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
                  value={newAntProcessId}
                  catchInvalidInput={true}
                  customPattern={ARNS_TX_ID_ENTRY_REGEX}
                  setValue={(t) => {
                    setNewAntProcessId(t);
                  }}
                  validationPredicates={{
                    [VALIDATION_INPUT_TYPES.ARWEAVE_ID]: {
                      fn: async (id: string) => {
                        if (!isArweaveTransactionID(id)) {
                          throw new Error('Invalid Process ID');
                        }
                      },
                    },
                  }}
                />
                {isArweaveTransactionID(newAntProcessId) === false &&
                newAntProcessId.length ? (
                  <span className="text-error h-[10px]">
                    Invalid ANT Configuration
                  </span>
                ) : (
                  <span className="h-[10px]"></span>
                )}
              </div>
              <WarningCard
                customIcon={<TriangleAlert size={'18px'} />}
                wrapperStyle={{ border: 'none' }}
                text={
                  <div className="flex flex-row size-full">
                    <span>
                      Make sure that the destination ANT can handle the
                      name&apos;s functions, and that you have securely verified
                      the ANT owner&apos;s address and details before
                      proceeding. This action is irreversible.
                    </span>
                  </div>
                }
              />
            </div>
          ) : (
            <div className="flex flex-col text-white max-w-[32rem] max-h-[40rem] gap-6 pb-4">
              <span>
                You are about to reassign your name registration from one ANT
                (Arweave Name Token) to a new ANT.
              </span>
              <RadioGroup
                value={workflow ?? REASSIGN_NAME_WORKFLOWS.NEW_EXISTING}
                onChange={(v) => setWorkflow(v)}
                className="flex flex-col gap-2.5"
                indicatorClass={`
                  relative flex size-full items-center justify-center rounded-full border border-white bg-foreground 
                  after:block data-[state=checked]:after:size-[16px] data-[state=unchecked]:after:size-[0px] after:rounded-full data-[state=checked]:after:bg-white
                  `}
                defaultValue={REASSIGN_NAME_WORKFLOWS.NEW_EXISTING}
                items={[
                  {
                    label: (
                      <label
                        htmlFor="r0"
                        className={`pl-[15px] text-[15px] leading-none ${
                          workflow === REASSIGN_NAME_WORKFLOWS.NEW_EXISTING
                            ? 'text-white'
                            : 'text-grey'
                        } whitespace-nowrap cursor-pointer hover:text-white`}
                      >
                        Carry over existing configuration
                      </label>
                    ),
                    value: REASSIGN_NAME_WORKFLOWS.NEW_EXISTING,
                    className:
                      'size-[25px] cursor-pointer rounded-full border border-white shadow-[0_2px_10px] shadow-black outline-none hover:bg-white focus:shadow-[0_0_0_2px] focus:shadow-black transition-all',
                  },
                  {
                    label: (
                      <label
                        htmlFor="r1"
                        className={`pl-[15px] text-[15px] leading-none ${
                          workflow === REASSIGN_NAME_WORKFLOWS.NEW_BLANK
                            ? 'text-white'
                            : 'text-grey'
                        } whitespace-nowrap cursor-pointer hover:text-white`}
                      >
                        Use blank slate
                      </label>
                    ),
                    value: REASSIGN_NAME_WORKFLOWS.NEW_BLANK,
                    className:
                      'size-[25px] cursor-pointer rounded-full border  border-white shadow-[0_2px_10px] shadow-black outline-none hover:bg-white focus:shadow-[0_0_0_2px] focus:shadow-black transition-all',
                  },
                ]}
              />

              <div className="flex flex-col gap-1">
                <span>Once completed:</span>
                <ul className="flex flex-col gap-2 pl-6 list-disc">
                  {workflow === REASSIGN_NAME_WORKFLOWS.NEW_EXISTING ? (
                    <>
                      <li>
                        A new ANT will be created and owned by your wallet.
                      </li>
                      <li>
                        Ownership of the name will be fully reassigned to the
                        new ANT.
                      </li>
                      <li>
                        The name&apos;s existing purchase type and undername
                        allocation will remain as-is.
                      </li>
                      <li>Associated controllers will be carried over.</li>
                      <li>
                        Associated undername configurations and data pointers
                        will also be carried over.
                      </li>
                    </>
                  ) : (
                    <>
                      <li>
                        A new ANT will be created and owned by your wallet.
                      </li>
                      <li>
                        Ownership of the name will be fully reassigned to the
                        new ANT.
                      </li>
                      <li>
                        The name&apos;s existing purchase type and undername
                        allocation will remain as-is.
                      </li>
                      <li>Associated controllers will NOT be carried over.</li>
                      <li>
                        Associated undername configurations and data pointers
                        will also NOT be carried over.
                      </li>
                    </>
                  )}
                </ul>
              </div>

              <WarningCard
                customIcon={<TriangleAlert size={'18px'} />}
                wrapperStyle={{ border: 'none' }}
                text={
                  <div className="flex flex-row size-full">
                    <span>This action is irreversible.</span>
                  </div>
                }
              />
            </div>
          )
        }
        cancelText="Back"
        nextText="Next"
        onCancel={() => {
          setWorkflow(undefined);
        }}
        onClose={!signing ? () => handleClose() : undefined}
        onNext={
          workflow === REASSIGN_NAME_WORKFLOWS.EXISTING
            ? isArweaveTransactionID(newAntProcessId)
              ? () => {
                  setAntType(workflow);
                  setWorkflow(REASSIGN_NAME_WORKFLOWS.REVIEW);
                }
              : undefined
            : () => {
                setAntType(workflow);
                setWorkflow(REASSIGN_NAME_WORKFLOWS.REVIEW);
              }
        }
        footerClass={'py-11'}
      />
    </div>
  );
}
