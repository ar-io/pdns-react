import {
  AOS_MODULE_ID as ANT_MODULE_ID,
  ContractSigner,
  SpawnANTState,
  createAoSigner,
} from '@ar.io/sdk/web';
import AntChangelog from '@src/components/cards/AntChangelog';
import { Tooltip } from '@src/components/data-display';
import { CloseIcon } from '@src/components/icons';
import ArweaveID, {
  ArweaveIdTypes,
} from '@src/components/layout/ArweaveID/ArweaveID';
import { buildDomainInfoQuery } from '@src/hooks/useDomainInfo';
import { ArweaveTransactionID } from '@src/services/arweave/ArweaveTransactionID';
import {
  dispatchArNSUpdate,
  useArNSState,
  useGlobalState,
  useTransactionState,
  useWalletState,
} from '@src/state';
import dispatchANTInteraction from '@src/state/actions/dispatchANTInteraction';
import { ANT_INTERACTION_TYPES } from '@src/types';
import {
  formatForMaxCharCount,
  getAntsRequiringUpdate,
  lowerCaseDomain,
  sleep,
} from '@src/utils';
import { DEFAULT_ANT_LUA_ID } from '@src/utils/constants';
import eventEmitter from '@src/utils/events';
import { queryClient } from '@src/utils/network';
import { Checkbox } from 'antd';
import Lottie from 'lottie-react';
import { useCallback, useEffect, useState } from 'react';

import arioLoading from '../../../icons/ario-spinner.json';
import './styles.css';

function UpgradeDomainsModal({
  visible,
  setVisible,
}: {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}) {
  const [{ antAoClient, aoNetwork, arioProcessId, arioContract }] =
    useGlobalState();
  const [{ wallet, walletAddress }] = useWalletState();
  const [accepted, setAccepted] = useState(false);
  const [domainsToUpgrade, setDomainsToUpgrade] = useState<string[]>([]);
  const [, dispatchTransactionState] = useTransactionState();
  const [{ ants, domains }, dispatchArNSState] = useArNSState();
  // 0 or greater means loading, -1 means not loading
  const [progress, setProgress] = useState(-1);
  const isUpdatingAnts = useCallback(() => progress >= 0, [progress]);
  const [signingMessage, setSigningMessage] = useState('');

  useEffect(() => {
    if (walletAddress) {
      const antsRequiringUpdate = getAntsRequiringUpdate({
        ants,
        userAddress: walletAddress.toString(),
      });
      setDomainsToUpgrade(
        Object.entries(domains).reduce((acc: string[], [domain, record]) => {
          if (antsRequiringUpdate.includes(record.processId)) {
            acc = [...acc, domain];
          }
          return acc;
        }, []),
      );
    }
  }, [ants, domains, walletAddress]);

  function handleClose() {
    setVisible(false);
    setAccepted(false);
    setProgress(-1);
  }

  async function upgradeDomains() {
    if (isUpdatingAnts()) return;
    try {
      setProgress(0);
      if (!wallet?.contractSigner || !walletAddress) {
        throw new Error('No Wander Signer found');
      }

      const signer = createAoSigner(wallet?.contractSigner as ContractSigner);
      // deliberately not using concurrency here for UX reasons
      const failedUpgrades = [];
      for (const domain of domainsToUpgrade) {
        const domainData = await queryClient.fetchQuery(
          buildDomainInfoQuery({
            domain,
            arioContract,
            arioProcessId,
            aoNetwork,
            wallet,
          }),
        );
        const previousState: SpawnANTState = {
          controllers: domainData.controllers,
          records: domainData.records,
          owner: walletAddress.toString(),
          ticker: domainData.ticker,
          name: domainData.name,
          description: domainData.state?.Description ?? '',
          keywords: domainData.state?.Keywords ?? [],
          balances: domainData.state?.Balances ?? {},
        };

        await dispatchANTInteraction({
          payload: {
            arioProcessId,
            state: previousState,
            name: lowerCaseDomain(domain),
          },
          workflowName: ANT_INTERACTION_TYPES.UPGRADE_ANT,
          processId: domainData.processId,
          owner: walletAddress.toString(),
          ao: antAoClient,
          signer,
          dispatchTransactionState,
          dispatchArNSState,
          stepCallback: async (step?: string | Record<string, string>) => {
            if (typeof step === 'string') {
              setSigningMessage(`${step}`);
            }
          },
        }).catch(() => {
          failedUpgrades.push(domainData.processId);
        });
        setProgress((prev) => Math.round(prev + 100 / domainsToUpgrade.length));
      }
      if (failedUpgrades.length < domainsToUpgrade.length) {
        eventEmitter.emit('success', {
          message: (
            <div>
              <span>
                Updated {domainsToUpgrade.length - failedUpgrades.length}{' '}
                Domains to Module ID{' '}
                <ArweaveID
                  characterCount={8}
                  shouldLink={true}
                  type={ArweaveIdTypes.TRANSACTION}
                  id={new ArweaveTransactionID(ANT_MODULE_ID)}
                />
              </span>
            </div>
          ),
          name: `${domainsToUpgrade.length - failedUpgrades.length} of ${
            domainsToUpgrade.length
          } Domains successfully updated!'`,
        });
      }
      // slight delay for UX so the stage is visible on shorter updates
      await sleep(3000);
    } catch (error) {
      eventEmitter.emit('error', error);
    } finally {
      dispatchArNSUpdate({
        dispatch: dispatchArNSState,
        walletAddress: walletAddress!,
        arioProcessId: arioProcessId,
        aoNetworkSettings: aoNetwork,
      });
      handleClose();
    }
  }

  if (!visible) return <></>;

  return (
    <div className="modal-container items-center justify-center">
      <div className="flex h-fit max-h-[40rem] w-[35rem] justify-between flex-col rounded-lg bg-[#1B1B1D] shadow-one">
        <div className="flex flex-row justify-between border-b-[1px] border-dark-grey px-8 py-4">
          <h1
            className="flex flex-row text-xl text-white"
            style={{ gap: '10px' }}
          >
            {progress < 0 ? (
              <>Upgrade {domainsToUpgrade.length} of your Domains</>
            ) : (
              <>
                {signingMessage} {progress}%
              </>
            )}
          </h1>
          <button
            disabled={progress >= 0}
            className="text-md text-white"
            onClick={() => handleClose()}
          >
            <CloseIcon width={'20px'} fill={'white'} />
          </button>
        </div>
        {progress < 0 ? (
          <>
            <div className="flex box-border h-full overflow-hidden w-full flex-col px-8 py-4 text-sm text-white">
              <div className="flex scrollbar h-full min-h-[120px] border-b-[1px] border-dark-grey pb-4 mb-4 overflow-y-scroll scrollbar-thumb-primary-thin scrollbar-thumb-rounded-full scrollbar-w-2">
                <AntChangelog />
              </div>

              <span
                className="flex flex-row items-center text-base py-4"
                style={{ gap: '10px' }}
              >
                <Checkbox
                  rootClassName="accept-checkbox"
                  onChange={(checked) => setAccepted(checked.target.checked)}
                  value={accepted}
                />
                I understand and wish to proceed{' '}
                <Tooltip
                  message={
                    <div className="flex flex-col">
                      <span>
                        This will conduct an &apos;Reassign&apos; Action on your
                        ANT process to fork the ant to and upgraded version with
                        the latest ANT Module ID
                      </span>
                      <span className="pt-2 text-primary">
                        View the code:{' '}
                        <a
                          className="text-link"
                          href={`https://arscan.io/tx/${DEFAULT_ANT_LUA_ID}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {formatForMaxCharCount(DEFAULT_ANT_LUA_ID, 8)}
                        </a>
                      </span>
                    </div>
                  }
                />
              </span>
            </div>
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center">
            <Lottie
              animationData={arioLoading}
              loop={true}
              className="h-[250px]"
            />
          </div>
        )}

        {/* footer */}
        <div>
          <button
            disabled={!accepted || isUpdatingAnts()}
            className={`${
              !accepted
                ? 'bg-background text-grey'
                : `animate-pulse ${
                    progress < 0
                      ? 'bg-primary-thin text-primary'
                      : 'bg-link text-white hover:bg-primary hover:text-black'
                  } `
            } w-full rounded-b-lg p-4 transition-all text-sm`}
            onClick={() => upgradeDomains()}
          >
            {!accepted && progress < 0
              ? 'Verify you understand before proceeding'
              : progress >= 0
              ? 'Updating, please wait...'
              : 'Upgrade'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UpgradeDomainsModal;
