import {
  ANT,
  AOProcess,
  AoANTInfo,
  AoANTState,
  AoClient,
} from '@ar.io/sdk/web';
import Dexie, { type EntityTable } from 'dexie';

export type ArNSAppDB = Dexie & {
  antInfos: EntityTable<
    CachedAoANTInfo,
    'id' // primary key "id" (for the typings only)
  >;
  antStates: EntityTable<
    CachedAoANTState,
    'id' // primary key "id" (for the typings only)
  >;
};

export interface CachedAoANTInfo extends AoANTInfo {
  id: number;
  processId: string;
  timestamp: number;
}

export interface CachedAoANTState extends AoANTState {
  id: number;
  processId: string;
  timestamp: number;
}

export const createDb = (dbName: string) => {
  const db = new Dexie(dbName) as ArNSAppDB;
  // Schema declaration:
  db.version(1).stores({
    antInfos: '++id, processId, timestamp',
    antStates: '++id, processId, timestamp',
  });

  return db;
};

export const ARNS_APP_DB = createDb('ArNSAppDB');

export const getAoANTInfo = async (
  arnsAppDB: ArNSAppDB,
  ao: AoClient,
  processId: string,
  cacheFirst = false,
): Promise<AoANTInfo> => {
  //   console.log('getAoANTInfo', processId, cacheFirst);
  if (cacheFirst) {
    const antInfo = await arnsAppDB.antInfos
      .where('processId')
      .equals(processId)
      .first();
    if (antInfo) {
      //   console.log('found cached', antInfo);
      return antInfo;
    }
  }

  const ant = ANT.init({ process: new AOProcess({ processId, ao }) });
  const antInfo = await ant.getInfo();
  try {
    await arnsAppDB.antInfos.add({
      ...antInfo,
      processId,
      timestamp: Date.now(),
    });
  } catch (e) {
    console.error('Error with ant info saving:', processId, e);
  }
  return antInfo;
};

export const getAoANTState = async (
  arnsAppDB: ArNSAppDB,
  ao: AoClient,
  processId: string,
  cacheFirst = false,
): Promise<AoANTState> => {
  //   console.log('getAoANTState', processId, cacheFirst);
  if (cacheFirst) {
    const antState = await arnsAppDB.antStates
      .where('processId')
      .equals(processId)
      .first();
    if (antState) {
      //   console.log('found cached', antState);
      return antState;
    }
  }

  const ant = ANT.init({ process: new AOProcess({ processId, ao }) });
  const antState = await ant.getState();
  try {
    await arnsAppDB.antStates.add({
      ...antState,
      processId,
      timestamp: Date.now(),
    });
  } catch (e) {
    console.error('Error with ant state saving:', processId, e);
  }
  return antState;
};
