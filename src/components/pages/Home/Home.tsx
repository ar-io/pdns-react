import emojiRegex from 'emoji-regex';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useWalletAddress } from '../../../hooks';
import { useGlobalState } from '../../../state/contexts/GlobalState';
import { useRegistrationState } from '../../../state/contexts/RegistrationState';
import { useTransactionState } from '../../../state/contexts/TransactionState';
import {
  ArweaveTransactionID,
  BuyRecordPayload,
  INTERACTION_TYPES,
} from '../../../types';
import { isDomainAuctionable } from '../../../utils';
import {
  ATOMIC_FLAG,
  FEATURED_DOMAINS,
  PDNS_REGISTRY_ADDRESS,
  RESERVED_NAME_LENGTH,
} from '../../../utils/constants';
import {
  decodeDomainToASCII,
  encodeDomainToASCII,
  isPDNSDomainNameAvailable,
  isPDNSDomainNameValid,
} from '../../../utils/searchUtils/searchUtils';
import SearchBar from '../../inputs/Search/SearchBar/SearchBar';
import { FeaturedDomains, Loader, RegisterNameForm } from '../../layout';
import { SearchBarFooter, SearchBarHeader } from '../../layout';
import Workflow from '../../layout/Workflow/Workflow';
import './styles.css';

function Home() {
  const [, dispatchTransactionState] = useTransactionState();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [{ pdnsSourceContract }] = useGlobalState();
  const { walletAddress } = useWalletAddress();
  const [
    { domain, pdntID, stage, isSearching, registrationType, leaseDuration },
    dispatchRegisterState,
  ] = useRegistrationState();

  const [featuredDomains, setFeaturedDomains] = useState<{
    [x: string]: string;
  }>();

  useEffect(() => {
    if (domain) {
      const serializeSearchParams: Record<string, string> = {
        search: decodeDomainToASCII(domain),
      };
      setSearchParams(serializeSearchParams);
      return;
    }
  }, [domain]);

  useEffect(() => {
    const searchDomain = searchParams.get('search');
    if (searchDomain && searchDomain !== domain) {
      dispatchRegisterState({
        type: 'setDomainName',
        payload: searchDomain,
      });
      return;
    }
  }, [searchParams]);

  useEffect(() => {
    if (Object.keys(pdnsSourceContract.records).length) {
      const newFeaturedDomains = Object.fromEntries(
        FEATURED_DOMAINS.map((domain: string) =>
          pdnsSourceContract.records[domain]?.contractTxId
            ? [domain, pdnsSourceContract.records[domain].contractTxId]
            : [],
        ).filter((n) => n.length),
      );

      setFeaturedDomains(newFeaturedDomains);
    }
  }, [pdnsSourceContract]);

  return (
    <div className="page">
      {stage < 1 ? (
        <div
          className="white"
          style={{ fontSize: 57, padding: 56, fontWeight: 500 }}
        >
          Arweave Name System
        </div>
      ) : (
        <></>
      )}

      {!Object.keys(pdnsSourceContract.records).length ? (
        <Loader
          size={80}
          wrapperStyle={{ margin: '75px' }}
          message="Loading ARNS Registry Contract..."
        />
      ) : (
        <div
          className="flex flex-column flex-center"
          style={{
            width: '100%',
            gap: 0,
            maxWidth: '900px',
            minWidth: '750px',
          }}
        >
          <Workflow
            stage={stage.toString()}
            onNext={() => {
              if (stage == 1 && domain) {
                const buyRecordPayload: BuyRecordPayload = {
                  name:
                    domain && emojiRegex().test(domain)
                      ? encodeDomainToASCII(domain)
                      : domain,
                  contractTxId: pdntID ? pdntID.toString() : ATOMIC_FLAG,
                  tier: pdnsSourceContract.tiers.current[0],
                  years: leaseDuration,
                  type: registrationType,
                  auction: isDomainAuctionable({
                    domain: domain,
                    registrationType: registrationType,
                    reservedList: Object.keys(pdnsSourceContract.reserved),
                  }),
                };

                dispatchTransactionState({
                  type: 'setTransactionData',
                  payload: {
                    assetId: PDNS_REGISTRY_ADDRESS,
                    functionName: 'buyRecord',
                    ...buyRecordPayload,
                  },
                });
                dispatchTransactionState({
                  type: 'setInteractionType',
                  payload: INTERACTION_TYPES.BUY_RECORD,
                });
                // navigate to the transaction page, which will load the updated state of the transaction context
                navigate('/transaction', {
                  state: `/?search=${domain}`,
                  replace: true,
                });
                dispatchRegisterState({
                  type: 'reset',
                });
                return;
              }
              dispatchRegisterState({
                type: 'setStage',
                payload: stage + 1,
              });
            }}
            onBack={() => {
              if (stage === 0) {
                setSearchParams();
                dispatchRegisterState({
                  type: 'reset',
                });
                return;
              }
              dispatchRegisterState({
                type: 'setStage',
                payload: stage - 1,
              });
            }}
            stages={{
              0: {
                component: (
                  <SearchBar
                    values={pdnsSourceContract.records}
                    value={domain ? decodeDomainToASCII(domain) : domain}
                    onSubmit={(next = false) => {
                      dispatchRegisterState({
                        type: 'setIsSearching',
                        payload: true,
                      });
                      if (next) {
                        dispatchRegisterState({
                          type: 'setStage',
                          payload: stage + 1,
                        });
                      }
                    }}
                    onChange={() => {
                      dispatchRegisterState({
                        type: 'reset',
                      });
                    }}
                    onSuccess={(value: string) => {
                      dispatchRegisterState({
                        type: 'setDomainName',
                        payload: value,
                      });
                      dispatchRegisterState({
                        type: 'setPDNTID',
                        payload: undefined,
                      });
                    }}
                    onFailure={(name: string, result?: string) => {
                      dispatchRegisterState({
                        type: 'setDomainName',
                        payload: encodeDomainToASCII(name),
                      });
                      dispatchRegisterState({
                        type: 'setPDNTID',
                        payload: result
                          ? new ArweaveTransactionID(result)
                          : undefined,
                      });
                    }}
                    successPredicate={(value: string | undefined) =>
                      isPDNSDomainNameAvailable({
                        name: value ? encodeDomainToASCII(value) : value,
                        records: pdnsSourceContract?.records ?? {},
                      })
                    }
                    validationPredicate={(value: string | undefined) =>
                      isPDNSDomainNameValid({ name: value })
                    }
                    placeholderText={'Search for a name'}
                    headerElement={
                      <SearchBarHeader
                        defaultText={'Find a name'}
                        reservedList={
                          pdnsSourceContract.reserved
                            ? Object.keys(pdnsSourceContract.reserved)
                            : []
                        }
                      />
                    }
                    footerElement={
                      <SearchBarFooter
                        reservedList={
                          pdnsSourceContract.reserved
                            ? Object.keys(pdnsSourceContract.reserved)
                            : []
                        }
                        searchTerm={domain}
                        searchResult={
                          domain &&
                          pdnsSourceContract.records[
                            encodeDomainToASCII(domain)
                          ]
                            ? new ArweaveTransactionID(
                                pdnsSourceContract.records[
                                  encodeDomainToASCII(domain)
                                ].contractTxId,
                              )
                            : undefined
                        }
                      />
                    }
                    height={65}
                  />
                ),
                disableNext: !isSearching,
                showNext: false,
                showBack: false,
                requiresWallet: !!domain && !pdntID,
              },
              1: {
                component: <RegisterNameForm />,
                showNext: true,
                showBack: true,
                disableNext: !walletAddress,
                requiresWallet: true,
                customNextStyle: { width: 110, padding: '15px' },
                customBackStyle: { width: 110, padding: '15px' },
              },
            }}
          />
          {featuredDomains &&
          !pdntID &&
          stage < 1 &&
          !Object.keys(pdnsSourceContract.reserved).includes(domain!) &&
          !(domain && domain.length <= RESERVED_NAME_LENGTH) ? (
            <FeaturedDomains domains={featuredDomains} />
          ) : (
            <></>
          )}
        </div>
      )}
    </div>
  );
}

export default Home;
