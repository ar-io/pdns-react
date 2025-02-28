import {
  ANTRegistry,
  ANT_REGISTRY_ID,
  AOProcess,
  ARIO,
  AoANTHandler,
  AoARIORead,
  AoArNSNameData,
  fetchAllArNSRecords,
} from '@ar.io/sdk/web';
import { connect } from '@permaweb/aoconnect';
import { captureException } from '@sentry/react';
import { buildDomainInfoQuery } from '@src/hooks/useDomainInfo';
import { buildAllGraphQLTransactionsQuery } from '@src/hooks/useGraphQL';
import { AoAddress } from '@src/types';
import { NETWORK_DEFAULTS } from '@src/utils/constants';
import eventEmitter from '@src/utils/events';
import { queryClient } from '@src/utils/network';
import { TransactionEdge } from 'arweave-graphql';
import { pLimit } from 'plimit-lit';
import { Dispatch } from 'react';

import { ANTProcessData } from '../contexts';
import { ArNSAction } from '../reducers/ArNSReducer';

export async function dispatchArNSUpdate({
  dispatch,
  walletAddress,
  arioProcessId,
  aoNetworkSettings,
}: {
  dispatch: Dispatch<ArNSAction>;
  walletAddress: AoAddress;
  arioProcessId: string;
  aoNetworkSettings: typeof NETWORK_DEFAULTS.AO;
}) {
  try {
    const gateway = aoNetworkSettings.ANT.GRAPHQL_URL.replace(
      /^(https?:\/\/)?graphql(\/)?/,
      '',
    );
    const ao = connect(aoNetworkSettings.ARIO);
    const throttle = pLimit(20);
    // reset queries
    queryClient.resetQueries({ queryKey: ['domainInfo'] });
    queryClient.resetQueries({
      queryKey: ['ant'],
    });
    queryClient.resetQueries({
      queryKey: ['ant-info'],
    });

    dispatch({ type: 'reset' });
    dispatch({
      type: 'setLoading',
      payload: true,
    });
    const arioContract = ARIO.init({
      process: new AOProcess({ processId: arioProcessId, ao }),
    }) as AoARIORead;
    const antRegistry = ANTRegistry.init({
      process: new AOProcess({
        processId: ANT_REGISTRY_ID,
        ao: connect(aoNetworkSettings.ANT),
      }),
    });
    // TODO: we should paginate or send a filter by process ID on the network process for the records we want
    const [arnsRecords, allUserAnts] = await Promise.all([
      fetchAllArNSRecords({ contract: arioContract, pageSize: 1000 }),
      antRegistry.accessControlList({ address: walletAddress.toString() }),
    ]);

    const flatAntIds = new Set([
      ...allUserAnts.Controlled,
      ...allUserAnts.Owned,
    ]);

    const userDomains = Object.entries(arnsRecords).reduce(
      (acc: Record<string, AoArNSNameData>, recordData) => {
        const [name, record] = recordData;
        if (flatAntIds.has(record.processId)) {
          acc[name] = record;
        }
        return acc;
      },
      {},
    );

    // ONLY QUERY FOR ANTS THAT WE ARE INTERESTED IN, EG REGISTERED ANTS
    const registeredUserAnts = Array.from(
      new Set(Object.values(userDomains).map((record) => record.processId)),
    );

    // Fetch ANT Process meta from graphql
    const antMetas = (await queryClient
      .fetchQuery<TransactionEdge['node'][] | null>(
        buildAllGraphQLTransactionsQuery(registeredUserAnts, gateway) as any,
      )
      .then((res) =>
        res?.reduce(
          (
            acc: Record<string, TransactionEdge['node']>,
            node: TransactionEdge['node'],
          ) => {
            if (!node) return acc;

            acc[node.id] = node;
            return acc;
          },
          {},
        ),
      )) as any as Record<string, TransactionEdge['node']>;

    dispatch({
      type: 'setDomains',
      payload: userDomains,
    });

    // we set the default states to null so that they can match up in the tables
    dispatch({
      type: 'setAnts',
      payload: registeredUserAnts.reduce(
        (acc: Record<string, ANTProcessData>, id: string) => {
          acc[id] = {
            state: null,
            handlers: null,
            processMeta: antMetas?.[id] ?? null,
          };
          return acc;
        },
        {},
      ),
    });

    // Can be useDomainInfo fetch here (from ant id, not domain)
    const fetchAntDetails = async (id: string) => {
      try {
        const domainInfo = await queryClient.fetchQuery(
          buildDomainInfoQuery({
            antId: id,
            aoNetwork: aoNetworkSettings,
            gateway,
          }),
        );
        dispatch({
          type: 'addAnts',
          payload: {
            [id]: {
              state: domainInfo.state ?? null,
              handlers: (domainInfo.info?.Handlers ??
                domainInfo.info?.HandlerNames ??
                null) as AoANTHandler[] | null,
              processMeta: antMetas[id] ?? null,
              errors: domainInfo.errors ?? [],
            },
          },
        });
      } catch (error: any) {
        const errorHandler = (e: string) => {
          if (e.startsWith('Error getting ArNS records')) {
            eventEmitter.emit('network:ao:congested', true);
            eventEmitter.emit(
              'error',
              new Error(
                'Unable to load ArNS records. Please refresh to try again.',
              ),
            );
            dispatch({
              type: 'setLoading',
              payload: false,
            });
            dispatch({
              type: 'setPercentLoaded',
              payload: undefined,
            });
          } else if (e.includes('Timeout')) {
            eventEmitter.emit('network:ao:congested', true);
            // capture and report the exception, but do not emit error notification
            captureException(new Error(e), {
              tags: {
                walletAddress: walletAddress.toString(),
                arioProcessId: arioProcessId,
              },
            });
          } else if (!e.includes('does not support provided action.')) {
            captureException(new Error(e), {
              tags: {
                walletAddress: walletAddress.toString(),
                arioProcessId: arioProcessId,
              },
            });
            console.error(new Error(e));
          }
        };
        errorHandler(error.message);
      } finally {
        dispatch({
          type: 'incrementAntCount',
        });
        dispatch({
          type: 'setPercentLoaded',
          payload: registeredUserAnts.length,
        });
      }
    };

    await Promise.all(
      registeredUserAnts.map((id) => throttle(() => fetchAntDetails(id))),
    );
  } catch (error) {
    captureException(error);
  } finally {
    /// cleanup states
    dispatch({
      type: 'setLoading',
      payload: false,
    });
    dispatch({
      type: 'setPercentLoaded',
      payload: undefined,
    });
  }
}
