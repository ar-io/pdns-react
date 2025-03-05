import { ANT, AOProcess, AoArNSNameData } from '@ar.io/sdk/web';
import Tooltip from '@src/components/Tooltips/Tooltip';
import { ARNS_APP_DB, getAoANTInfo } from '@src/utils/db';
import { Pagination, PaginationProps } from 'antd';
import { useEffect, useRef, useState } from 'react';

import { useIsFocused } from '../../../../hooks';
import { ArweaveTransactionID } from '../../../../services/arweave/ArweaveTransactionID';
import { useGlobalState } from '../../../../state/contexts/GlobalState';
import { useWalletState } from '../../../../state/contexts/WalletState';
import { AoAddress, VALIDATION_INPUT_TYPES } from '../../../../types';
import { isArweaveTransactionID } from '../../../../utils';
import { ARWEAVE_TX_LENGTH } from '../../../../utils/constants';
import eventEmitter from '../../../../utils/events';
import { CloseIcon, HamburgerOutlineIcon } from '../../../icons';
import { Loader } from '../../../layout';
import ValidationInput from '../ValidationInput/ValidationInput';
import './styles.css';

type NameTokenDetails = {
  [id: string]: {
    owner: string;
    controllers: string[];
    name: string;
    ticker: string;
    names: string[];
  };
};

function NameTokenSelector({
  selectedTokenCallback,
}: {
  selectedTokenCallback: (id: ArweaveTransactionID | undefined) => void;
}) {
  const [{ arweaveDataProvider, antAoClient }] = useGlobalState();
  const [{ walletAddress }] = useWalletState();

  const [searchText, setSearchText] = useState<string>();
  const [tokens, setTokens] = useState<NameTokenDetails>();
  const [loading, setLoading] = useState(false);
  const [filteredTokens, setFilteredTokens] =
    useState<
      Array<
        | { id: string; name?: string; ticker?: string; names?: string[] }
        | undefined
      >
    >();
  const [selectedToken, setSelectedToken] = useState<
    { id: string; name: string; ticker: string; names: string[] } | undefined
  >(undefined);
  const [searching, setSearching] = useState<boolean>(false);
  const [searchActive, setSearchActive] = useState(false);
  const [validImport, setValidImport] = useState<boolean | undefined>(
    undefined,
  );
  const isFocused = useIsFocused('name-token-input');

  const listRef = useRef<HTMLDivElement>(null);
  const [listPage, setListPage] = useState<number>(1);
  const listItemCount = 3;

  useEffect(() => {
    selectedTokenCallback(
      selectedToken ? new ArweaveTransactionID(selectedToken.id) : undefined,
    );
    setListPage(1);
  }, [selectedToken]);

  // FIXME: disabled to avoid too many requests
  // useEffect(() => {
  //   if (!walletAddress) {
  //     return;
  //   }
  //   getTokenList(walletAddress);
  // }, [walletAddress]);

  useEffect(() => {
    if (!listRef.current) {
      return;
    }
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [listRef]);

  function handleClickOutside(e: any) {
    if (
      listRef.current &&
      e.target !== listRef.current &&
      !listRef.current.contains(e.target)
    ) {
      setSearchText('');
      setSearchActive(false);
      setFilteredTokens(undefined);
      setListPage(1);
    }
  }

  async function getTokenList(
    address: AoAddress | undefined,
    imports: ArweaveTransactionID[] = [],
  ) {
    try {
      setLoading(true);
      if (!address) {
        throw new Error('No address provided');
      }

      const fetchedprocessIds: Array<ArweaveTransactionID> = [];
      // const fetchedprocessIds = await arweaveDataProvider
      //   .getContractsForWallet({
      //     address,
      //   })
      //   .catch(() => {
      //     throw new Error('Unable to get contracts for wallet');
      //   });

      const validImports = imports.length
        ? await Promise.all(
            imports.map(async (id: ArweaveTransactionID) => {
              try {
                // const contract = ANT.init({
                //   process: new AOProcess({
                //     processId: id.toString(),
                //     ao: antAoClient,
                //   }),
                // });

                // const info = await contract.getInfo();

                const info = await getAoANTInfo(
                  ARNS_APP_DB,
                  antAoClient,
                  id.toString(),
                  true,
                );

                // TODO: further validate that contract exists and has valid state

                // if (!contract || !info) {
                if (!info) {
                  throw new Error('Unable to get contract');
                }

                setValidImport(true);
                return id;
              } catch (error) {
                eventEmitter.emit('error', error);
              }
            }),
          ).then(
            (ids: Array<ArweaveTransactionID | undefined>) =>
              ids.filter((id) => !!id) as ArweaveTransactionID[],
          )
        : [];

      if (!fetchedprocessIds.length && !validImports.length) {
        return;
      }

      const processIds = fetchedprocessIds.concat(validImports);
      const associatedRecords = await arweaveDataProvider.getRecords({
        filters: {
          processId: processIds,
        },
      });

      const contracts: {
        processId: ArweaveTransactionID;
        names: Record<string, AoArNSNameData>;
        owner: string;
        controllers: string[];
        ticker: string;
        name: string;
      }[] = await Promise.all(
        processIds.map(async (processId) => {
          const contract = ANT.init({
            process: new AOProcess({
              processId: processId.toString(),
              ao: antAoClient,
            }),
          });
          const names = Object.keys(associatedRecords).reduce(
            (acc: Record<string, AoArNSNameData>, id: string) => {
              if (associatedRecords[id].processId === processId.toString()) {
                acc[id] = associatedRecords[id];
              }
              return acc;
            },
            {},
          );

          const [owner, controllers, ticker, name] = await Promise.all([
            contract.getOwner(),
            contract.getControllers(),
            contract.getTicker(),
            contract.getName(),
          ]).catch(() => {
            throw new Error('Unable to get contract details');
          });
          return {
            processId,
            names,
            owner,
            controllers,
            ticker,
            name,
          };
        }),
      ).then((contracts) => contracts.filter((contract) => !!contract));

      if (!contracts.length) {
        throw new Error('Unable to get details for Name Tokens');
      }

      const newTokens: NameTokenDetails = contracts.reduce(
        async (result, contract) => {
          const { processId, owner, controllers, name, ticker, names } =
            contract;

          return {
            ...result,
            [processId.toString()]: {
              owner,
              controllers,
              name,
              ticker,
              names: Object.keys(names),
            },
          };
        },
        {},
      );

      // HACK: we have nested all Promise.all so await twice to resolve
      setTokens(await newTokens);
      if (validImports.length) {
        const details = newTokens[validImports[0].toString()];
        setSelectedToken({
          name: details?.name,
          ticker: details?.ticker,
          id: validImports[0].toString(),
          names: details?.names ?? [],
        });
      }
    } catch (error: any) {
      eventEmitter.emit('error', error);
    } finally {
      setLoading(false);
      setListPage(1);
    }
  }

  function handleTokenSearch(query: string) {
    try {
      setSearching(true);
      setValidImport(undefined);
      if (!query) {
        setSearchText('');
        return;
      }
      setSearchText(query);

      if (!tokens) {
        throw new Error('No Name Tokens Found');
      }
      const filteredResults = Object.keys(tokens)
        .filter((id) => {
          const { owner, controllers, name, ticker } = tokens[id];
          const queryResult = [owner, controllers, name, ticker, id].some(
            (term) =>
              term &&
              term.toString().toLowerCase().includes(query.toLowerCase()),
          );
          return queryResult;
        })
        .map((id) => {
          const { name, ticker, names } = tokens[id];
          return { id, name: name ?? '', ticker: ticker ?? '', names };
        })
        .filter((n) => !!n);
      if (!filteredResults.length) {
        throw new Error('No ANT tokens found for that search');
      }

      setFilteredTokens(filteredResults);
    } catch (error) {
      setFilteredTokens(undefined);
    } finally {
      setSearching(false);
      setListPage(1);
    }
  }

  function handleSetToken({
    id,
    name,
    ticker,
    names,
  }: {
    id?: string;
    name?: string;
    ticker?: string;
    names: string[];
  }) {
    try {
      setSearchText('');
      setFilteredTokens(undefined);

      if (id === undefined) {
        throw new Error(`No ID provided for ${name ?? ticker ?? ''}`);
      }
      setSelectedToken({ id, name: name ?? '', ticker: ticker ?? '', names });
      selectedTokenCallback(new ArweaveTransactionID(id));
      setListPage(1);
    } catch (error) {
      eventEmitter.emit('error', error);
    } finally {
      setSearchActive(false);
    }
  }

  const customPreviousAndNextButtons: PaginationProps['itemRender'] = (
    page,
    type,
    originalElement,
  ) => {
    if (!tokens) {
      return;
    }
    if (type === 'next' || type === 'prev') {
      return;
    }
    if (type === 'page') {
      return (
        <span
          className="flex flex-row hover center"
          style={{
            color: listPage == page ? 'white' : 'var(--text-grey)',
            width: '32px',
          }}
        >
          {page}
        </span>
      );
    }
    return originalElement;
  };

  function updatePage(page: number) {
    setListPage(page);
  }

  return (
    <div
      ref={listRef}
      className="flex flex-column radius"
      style={{
        position: 'relative',
        height: 'fit-content',
        maxHeight: '400px',
        border:
          isFocused || searchActive
            ? `1px solid var(--text-white)`
            : `1px solid var(--text-faded)`,
        gap: 0,
        boxSizing: 'border-box',
      }}
    >
      {/* input wrapper */}
      <div
        className="name-token-input-wrapper"
        style={{ borderBottom: '1px solid var(--text-faded)' }}
      >
        <ValidationInput
          inputId="name-token-input"
          onClick={() => setSearchActive(true)}
          showValidationIcon={true}
          setValue={(v) => handleTokenSearch(v)}
          value={searchText ?? ''}
          maxCharLength={ARWEAVE_TX_LENGTH}
          placeholder={
            selectedToken
              ? selectedToken.name?.length
                ? selectedToken.name
                : selectedToken.id
              : 'Add an Arweave Name Token (ANT)'
          }
          validationPredicates={{
            [VALIDATION_INPUT_TYPES.ARWEAVE_ID]: {
              fn: (id: string) => {
                return arweaveDataProvider.validateArweaveId(id);
              },
            },
          }}
          validityCallback={(validity) => validity}
          wrapperCustomStyle={{
            width: '100%',
            hieght: '45px',
            borderRadius: '0px',
            backgroundColor: 'var(--card-bg)',
            boxSizing: 'border-box',
            paddingLeft: '10px',
          }}
          inputClassName={`white ${
            selectedToken ? 'name-token-input-selected' : 'name-token-input'
          }`}
        />
        <span
          className={`flex flex-row text grey flex-center ${
            selectedToken ? 'bold' : ''
          } hover`}
          style={{
            width: 'fit-content',
            height: 'fit-content',
            wordBreak: 'keep-all',
          }}
        >
          {loading || searching ? (
            <Loader size={20} color="var(--text-white)" />
          ) : searchText && validImport === false ? (
            <></>
          ) : searchText &&
            isArweaveTransactionID(searchText) &&
            !Object.keys(tokens ?? []).includes(searchText) ? (
            <button
              className="outline-button flex flex-row center pointer"
              style={{
                borderRadius: '50px',
                width: 'fit-content',
                padding: '3px 6px',
                fontSize: '12px',
                minWidth: 'fit-content',
                border: '1px solid var(--text-grey)',
              }}
              onClick={() => {
                getTokenList(walletAddress, [
                  new ArweaveTransactionID(searchText),
                ]);
              }}
            >
              Import
            </button>
          ) : selectedToken ? (
            <button
              className="outline-button flex flex-row center pointer"
              style={{
                gap: '3px',
                borderRadius: '50px',
                width: 'fit-content',
                padding: '3px 7px',
                fontSize: '12px',
                minWidth: 'fit-content',
                border: '1px solid var(--text-grey)',
              }}
              onClick={() => {
                setSelectedToken(undefined);
                selectedTokenCallback(undefined);
              }}
            >
              <CloseIcon width={'13px'} height={'13px'} />
              Remove
            </button>
          ) : (
            <Tooltip message="For advanced use cases only, you can register this name with a custom ANT by entering its Process ID." />
          )}
        </span>
      </div>
      {/* selector dropdown */}
      {tokens && searchActive ? (
        <div
          className="flex flex-column"
          style={{
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            gap: 0,
            height: 'fit-content',
            width: '100%',
            backgroundColor: 'var(--card-bg)',
            boxSizing: 'border-box',
            zIndex: 10,
          }}
        >
          {searchText && !filteredTokens?.length ? (
            <span
              className="text-large center"
              style={{
                color: '#444547',
                margin: 'auto',
                height: '50px',
              }}
            >
              No Results
            </span>
          ) : filteredTokens ? (
            filteredTokens
              .slice(
                Math.max((listPage - 1) * listItemCount, 0),
                listPage * listItemCount,
              )
              .map((token, index) => {
                if (!token) {
                  return;
                }

                return (
                  <button
                    key={index}
                    className="name-token-item pointer"
                    onClick={() => {
                      handleSetToken({
                        id: token.id,
                        name: token.name ?? '',
                        ticker: token.ticker ?? '',
                        names: token.names ?? [],
                      });
                    }}
                  >
                    {token.name && token.ticker
                      ? `${token.name.slice(0, 20)} (${token.ticker}) - ${
                          token.id
                        }`
                      : token.id}
                    {token.names?.length ? (
                      <Tooltip
                        key={index}
                        icon={
                          <HamburgerOutlineIcon
                            width={20}
                            height={20}
                            fill="var(--text-grey)"
                          />
                        }
                        message={
                          <div
                            className="flex flex-column"
                            style={{
                              padding: '5px',
                              gap: '5px',
                              boxSizing: 'border-box',
                            }}
                          >
                            {token.names.map((name) => (
                              <span key={name}>{name}</span>
                            ))}
                          </div>
                        }
                      />
                    ) : (
                      <></>
                    )}
                  </button>
                );
              })
          ) : (
            Object.entries(tokens)
              .slice(
                Math.max((listPage - 1) * listItemCount, 0),
                listPage * listItemCount,
              )
              .map((token, index) => {
                if (!token) {
                  return;
                }
                const [id, details] = token;
                const { name, ticker, names } = details;

                return (
                  <button
                    key={index}
                    className="name-token-item pointer"
                    onClick={() => {
                      handleSetToken({
                        id,
                        name: name ?? '',
                        ticker: ticker ?? '',
                        names: names ?? [],
                      });
                    }}
                  >
                    {name && ticker
                      ? `${name.slice(0, 20)} ${
                          name.length > 20 ? '...' : ''
                        } (${ticker}) - ${id}`
                      : id}
                    {names?.length ? (
                      <Tooltip
                        icon={
                          <HamburgerOutlineIcon
                            width={20}
                            height={20}
                            fill="var(--text-grey)"
                          />
                        }
                        message={
                          <div
                            className="flex flex-column"
                            style={{
                              padding: '5px',
                              boxSizing: 'border-box',
                            }}
                          >
                            {names.map((name) => (
                              <span key={name}>{name}</span>
                            ))}
                          </div>
                        }
                      />
                    ) : (
                      <></>
                    )}
                  </button>
                );
              })
          )}
          <div
            className="custom-next-pagination flex flex-column"
            style={{
              padding: '10px 25px',
              boxSizing: 'border-box',
              width: '100%',
              justifyContent: 'flex-start',
            }}
          >
            {tokens.length || filteredTokens?.length || !searchText ? (
              <Pagination
                total={
                  Object.keys(tokens).length && !filteredTokens
                    ? Object.keys(tokens).length
                    : filteredTokens
                    ? filteredTokens.length
                    : 0
                }
                itemRender={customPreviousAndNextButtons}
                showPrevNextJumpers={true}
                showSizeChanger={false}
                showQuickJumper={false}
                onChange={updatePage}
                current={listPage}
                defaultPageSize={listItemCount}
              />
            ) : (
              <></>
            )}{' '}
          </div>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}

export default NameTokenSelector;
