import {
  AoANTState,
  AoARIORead,
  AoArNSNameData,
  AoClient,
  fetchAllArNSRecords,
  mARIOToken,
} from '@ar.io/sdk/web';
import { ArweaveCompositeDataProvider } from '@src/services/arweave/ArweaveCompositeDataProvider';
import { AoAddress } from '@src/types';
import { QueryClient } from '@tanstack/react-query';
import {
  PersistedClient,
  Persister,
} from '@tanstack/react-query-persist-client';
import { del, get, set } from 'idb-keyval';

import { isArweaveTransactionID } from '.';
import { ARNS_APP_DB, getAoANTState } from './db';

/**
 * Creates an Indexed DB persister
 * @see https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
 */
export function createIDBPersister(idbValidKey: IDBValidKey = 'reactQuery') {
  return {
    persistClient: async (client: PersistedClient) => {
      await set(idbValidKey, client);
    },
    restoreClient: async () => {
      return await get<PersistedClient>(idbValidKey);
    },
    removeClient: async () => {
      await del(idbValidKey);
    },
  } as Persister;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 1 day
    },
  },
});

export function buildAntStateQuery({
  processId,
  ao,
  meta,
}: {
  processId: string;
  ao: AoClient;
  meta?: string[];
}): {
  queryKey: ['ant', string] | string[];
  queryFn: () => Promise<AoANTState | null>;
  staleTime: number;
} {
  return {
    queryKey: ['ant', processId, ...(meta || [])],
    queryFn: async () => {
      if (!processId || !isArweaveTransactionID(processId))
        throw new Error('Must provide a valid process id');

      // const ant = ANT.init({ process: new AOProcess({ processId, ao }) });
      // return await ant.getState();
      return await getAoANTState(ARNS_APP_DB, ao, processId, true);
    },
    staleTime: Infinity,
  };
}

export function buildIOBalanceQuery({
  arioContract,
  address,
  meta,
}: {
  arioContract: AoARIORead;
  address: string;
  meta?: string[];
}): {
  queryKey: ['io-balance', string] | string[];
  queryFn: () => Promise<number>;
  staleTime: number;
} {
  return {
    queryKey: ['io-balance', address, ...(meta || [])],
    queryFn: async () => {
      return await arioContract
        .getBalance({
          address,
        })
        .then((balance) => {
          return new mARIOToken(balance).toARIO().valueOf();
        })
        .catch(() => 0);
    },
    staleTime: 1000 * 60 * 60, // one hour
  };
}
export function buildARBalanceQuery({
  provider,
  address,
  meta,
}: {
  provider: ArweaveCompositeDataProvider;
  address: AoAddress;
  meta?: string[];
}): {
  queryKey: ['ar-balance', string] | string[];
  queryFn: () => Promise<number>;
  staleTime: number;
} {
  return {
    queryKey: ['ar-balance', address.toString(), ...(meta || [])],
    queryFn: async () => {
      return await provider.getArBalance(address).catch(() => 0);
    },
    staleTime: 1000 * 60 * 60, // one hour
  };
}

export function buildArNSRecordsQuery({
  arioContract,
  meta,
}: {
  arioContract: AoARIORead;
  meta?: string[];
}): {
  queryKey: ['arns-records'] | string[];
  queryFn: () => Promise<Record<string, AoArNSNameData>>;
  staleTime: number;
} {
  return {
    queryKey: ['arns-records', ...(meta || [])],
    queryFn: () => {
      // TODO: we should add the last cursor retrieved and only fetch new records to avoid loading all of them on reload
      return fetchAllArNSRecords({
        contract: arioContract,
        pageSize: 1000,
      });
    },
    staleTime: Infinity,
  };
}
