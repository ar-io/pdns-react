import {
  AoANTRecord,
  AoArNSNameData,
  AoGetCostDetailsParams,
  ContractSigner,
} from '@ar.io/sdk/web';
import { ApiConfig } from 'arweave/web/lib/api';
import type { Dispatch, SetStateAction } from 'react';

import { AntDetailKey } from './components/cards/ANTCard/ANTCard';
import { ArweaveTransactionID } from './services/arweave/ArweaveTransactionID';
import { MAX_TTL_SECONDS, MIN_TTL_SECONDS } from './utils/constants';

export type ARNSDomains = Record<string, AoArNSNameData>;

export type TransactionHeaders = {
  id: string;
  signature: string;
  format: number;
  last_tx: string;
  owner: string;
  target: string;
  quantity: string;
  reward: string;
  data_size: string;
  data_root: string;
  tags: TransactionTag[];
};

export type TransactionTag = {
  name: string;
  value: string;
};

export type ARNSMapping = {
  domain: string;
  record?: AoArNSNameData;
  processId: ArweaveTransactionID | 'atomic';
  overrides?: { [x: string]: JSX.Element | string | number };
  disabledKeys?: string[];
  compact?: boolean;
  hover?: boolean;
  deployedTransactionId?: ArweaveTransactionID | string;
  mobileView?: boolean;
  bordered?: boolean;
  primaryDefaultKeys?: Partial<AntDetailKey>[];
  state?: {
    owner: string;
    ticker: string;
    name: string;
    controllers: string[];
    records: Record<string, AoANTRecord>;
  };
};

export type ARNSMetaData = {
  image?: string;
  expiration?: Date;
};

export type ARNSDomain = ARNSMapping & ARNSMetaData;

export type JsonWalletProvider = {
  key: any;
};

export type INTERACTION_PRICE_PARAMS =
  | {
      interactionName: INTERACTION_NAMES.BUY_RECORD;
      payload: BuyRecordPayload;
    }
  | {
      interactionName: INTERACTION_NAMES.EXTEND_RECORD;
      payload: ExtendLeasePayload;
    }
  | {
      interactionName: INTERACTION_NAMES.INCREASE_UNDERNAME_COUNT;
      payload: IncreaseUndernamesPayload;
    };

export interface ArNSWalletConnector {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getWalletAddress(): Promise<AoAddress>;
  getGatewayConfig(): Promise<ApiConfig>;
  contractSigner?: ContractSigner;
}

export enum WALLET_TYPES {
  WANDER = 'Wander',
  ARWEAVE_APP = 'ArweaveApp',
  ETHEREUM = 'Ethereum',
}

export interface KVCache {
  set(key: string, value: any): Promise<void>;
  get(key: string): Promise<any>;
  del(key: string, filter?: { key: string; value: string }): Promise<void>;
  push(key: string, value: any): Promise<void>;
  clean(): void;
}

export interface ArweaveDataProvider {
  // add isAddress method
  getTransactionStatus(
    ids: ArweaveTransactionID[] | ArweaveTransactionID,
    blockheight?: number,
  ): Promise<Record<string, { confirmations: number; blockHeight: number }>>;
  getTransactionTags(
    id: ArweaveTransactionID,
  ): Promise<{ [x: string]: string }>;
  validateTransactionTags(params: {
    id: string;
    requiredTags?: {
      [x: string]: string[] | ArweaveTransactionID[]; // allowed values
    };
  }): Promise<void>;
  validateArweaveId(id: string): Promise<ArweaveTransactionID>;
  validateConfirmations(
    id: string,
    numberOfConfirmations?: number,
  ): Promise<void>;
  validateArweaveAddress(address: string): Promise<undefined | boolean>;
  getArBalance(wallet: ArweaveTransactionID): Promise<number>;
  getArPrice(data: number): Promise<number>;
  getCurrentBlockHeight(): Promise<number>;
}

export type ConnectWalletModalProps = {
  setShowModal: Dispatch<SetStateAction<boolean>>;
};

export type TierCardProps = {
  tierId: string;
};

export type DropdownProps = {
  options: { [x: string]: any };
  optionsFilter?: () => Array<string>; // optional filter to sort passed array of options
  showSelected: boolean;
  showChevron: boolean;
  selected: any;
  setSelected: Dispatch<SetStateAction<any>>;
  headerElement?: JSX.Element;
  footerElement?: JSX.Element;
};

export type ManageTable = 'ants' | 'names';

export const MANAGE_TABLE_NAMES: Record<ManageTable, string> = {
  names: 'Names',
  ants: "ANT's",
};

export enum TRANSACTION_TYPES {
  LEASE = 'lease',
  BUY = 'permabuy',
}

export enum CONTRACT_TYPES {
  REGISTRY = 'ARNS Registry',
  ANT = 'Arweave Name Token',
}

export enum ASSET_TYPES {
  ANT = 'ANT',
  NAME = 'ARNS Name',
  UNDERNAME = 'Undername',
  COIN = 'coin',
}

export enum ANT_INTERACTION_TYPES {
  SET_CONTROLLER = 'Edit Controller',
  REMOVE_CONTROLLER = 'Remove Controller',
  SET_TICKER = 'Edit Ticker',
  SET_NAME = 'Edit Name',
  SET_RECORD = 'Add Undername',
  EDIT_RECORD = 'Edit Undername',
  SET_TARGET_ID = 'Edit Target ID',
  SET_TTL_SECONDS = 'Edit TTL Seconds',
  REMOVE_RECORD = 'Delete Undername',
  TRANSFER = 'Transfer ANT',
  EVOLVE = 'Upgrade ANT',
  RELEASE_NAME = 'Release Name',
  REASSIGN_NAME = 'Reassign Name',
  APPROVE_PRIMARY_NAME = 'Approve Primary Name',
  REMOVE_PRIMARY_NAMES = 'Remove Primary Names',
  SET_LOGO = 'Set Logo',
  SET_DESCRIPTION = 'Set Description',
  SET_KEYWORDS = 'Set Keywords',
  UPGRADE_ANT = 'Upgrade ANT',
}

export enum ARNS_INTERACTION_TYPES {
  BUY_RECORD = 'Buy ArNS Name',
  EXTEND_LEASE = 'Extend Lease',
  INCREASE_UNDERNAMES = 'Increase Undernames',
  TRANSFER = 'Transfer ARIO',
  PRIMARY_NAME_REQUEST = 'Primary Name Request', // two part interaction since the ant is the authority to approve the request
  UPGRADE_NAME = 'Upgrade ArNS Name',
}
export const ArNSInteractionTypeToIntentMap: Partial<
  Record<ARNS_INTERACTION_TYPES, AoGetCostDetailsParams['intent']>
> = {
  [ARNS_INTERACTION_TYPES.BUY_RECORD]: 'Buy-Name',
  [ARNS_INTERACTION_TYPES.EXTEND_LEASE]: 'Extend-Lease',
  [ARNS_INTERACTION_TYPES.UPGRADE_NAME]: 'Upgrade-Name',
  [ARNS_INTERACTION_TYPES.INCREASE_UNDERNAMES]: 'Increase-Undername-Limit',
  [ARNS_INTERACTION_TYPES.PRIMARY_NAME_REQUEST]: 'Primary-Name-Request',
};

export enum INTERACTION_TYPES {
  // Registry interaction types
  BUY_RECORD = 'Buy ArNS Name',
  EXTEND_LEASE = 'Extend Lease',
  INCREASE_UNDERNAMES = 'Increase Undernames',

  // ANT interaction types
  SET_CONTROLLER = 'Edit Controller',
  REMOVE_CONTROLLER = 'Remove Controller',
  SET_TICKER = 'Edit Ticker',
  SET_NAME = 'Edit Name',
  SET_TTL_SECONDS = 'Edit TTL Seconds',
  SET_TARGET_ID = 'Edit Target ID',
  SET_RECORD = 'Add Record',
  EDIT_RECORD = 'Edit Record',
  REMOVE_RECORD = 'Delete Record',
  CREATE = 'Create Arweave Name Token',
  TRANSFER_ANT = 'Transfer ANT',

  // Common interaction types
  TRANSFER = 'Transfer',
  BALANCE = 'Balance',
  UNKNOWN = 'Unknown',
}

export enum INTERACTION_NAMES {
  BUY_RECORD = 'buyRecord',
  EXTEND_RECORD = 'extendRecord',
  INCREASE_UNDERNAME_COUNT = 'increaseUndernameCount',
}

export enum UNDERNAME_TABLE_ACTIONS {
  CREATE = 'Create',
  REMOVE = 'Remove',
  EDIT = 'Edit',
}
const undernameTableInteractions = [
  UNDERNAME_TABLE_ACTIONS.CREATE,
  UNDERNAME_TABLE_ACTIONS.REMOVE,
  UNDERNAME_TABLE_ACTIONS.EDIT,
] as const;
export type UndernameTableInteractionTypes =
  (typeof undernameTableInteractions)[number];

export const createOrUpdateUndernameInteractions = [
  UNDERNAME_TABLE_ACTIONS.CREATE,
  UNDERNAME_TABLE_ACTIONS.EDIT,
] as const;
export const destructiveUndernameInteractions = [
  UNDERNAME_TABLE_ACTIONS.REMOVE,
] as const;
export const allUndernameInteractions = [
  ...createOrUpdateUndernameInteractions,
  ...destructiveUndernameInteractions,
] as const;

export type CreateOrEditUndernameInteraction = Exclude<
  UndernameTableInteractionTypes,
  UNDERNAME_TABLE_ACTIONS.REMOVE
>;

const commonInteractionTypeNames = [
  INTERACTION_TYPES.TRANSFER,
  INTERACTION_TYPES.BALANCE,
] as const;
const unknownInteractionType = INTERACTION_TYPES.UNKNOWN as const;
export const antInteractionTypes = [
  ...commonInteractionTypeNames,
  INTERACTION_TYPES.SET_CONTROLLER,
  INTERACTION_TYPES.REMOVE_CONTROLLER,
  INTERACTION_TYPES.SET_TICKER,
  INTERACTION_TYPES.SET_NAME,
  INTERACTION_TYPES.SET_TTL_SECONDS,
  INTERACTION_TYPES.SET_TARGET_ID,
  INTERACTION_TYPES.SET_RECORD,
  INTERACTION_TYPES.EDIT_RECORD,
  INTERACTION_TYPES.TRANSFER_ANT,

  INTERACTION_TYPES.REMOVE_RECORD,
] as const;
export const registryInteractionTypes = [
  ...commonInteractionTypeNames,
  ARNS_INTERACTION_TYPES.BUY_RECORD,
  ARNS_INTERACTION_TYPES.EXTEND_LEASE,
  ARNS_INTERACTION_TYPES.INCREASE_UNDERNAMES,
  ARNS_INTERACTION_TYPES.UPGRADE_NAME,
] as const;

export const interactionTypeNames = [
  ...antInteractionTypes,
  ...registryInteractionTypes,
] as const;
export const contractTypeNames = [
  CONTRACT_TYPES.REGISTRY,
  CONTRACT_TYPES.ANT,
] as const;
export type ContractTypes = (typeof contractTypeNames)[number];
export type InteractionTypes = (typeof interactionTypeNames)[number];
export type ANTInteractionType = (typeof antInteractionTypes)[number];
export type RegistryInteractionType = (typeof registryInteractionTypes)[number];
export type UnknownInteractionTypeName = typeof unknownInteractionType;
export type ValidInteractionType = ANTInteractionType | RegistryInteractionType;
export type InteractionTypeName =
  | ValidInteractionType
  | UnknownInteractionTypeName;
export type ExcludedValidInteractionType = Exclude<
  ValidInteractionType,
  INTERACTION_TYPES.BALANCE
>;

export type TransactionDataBasePayload = {
  assetId: string;
  functionName: string;
  deployedTransactionId?: ArweaveTransactionID;
  interactionPrice?: number;
  arnsRecord?: AoArNSNameData;
};

// registry transaction payload types
export type BuyRecordPayload = {
  name: string;
  processId: string;
  years?: number;
  type: TRANSACTION_TYPES;
  qty?: number; // the cost displayed to the user when buying a record
  targetId?: ArweaveTransactionID;
};

export type ExtendLeasePayload = {
  name: string;
  years: number;
  processId: ArweaveTransactionID;
  qty?: number;
};

export type TransferIOPayload = {
  target: string;
  qty: number;
};
export type IncreaseUndernamesPayload = {
  name: string;
  qty: number;
  oldQty?: number;
  processId: string;
};
//end registry transaction payload types

//ant transaction payload types
export type SetTickerPayload = {
  ticker: string;
};

export type SetControllerPayload = {
  target: string;
};

export type RemoveControllerPayload = {
  target: string;
};

export type SetNamePayload = {
  name: string;
};

export type SetRecordPayload = {
  subDomain: string;
  transactionId: string;
  ttlSeconds: number;
  previousRecord?: AoANTRecord;
};

export type RemoveRecordPayload = {
  subDomain: string;
};

export type TransferANTPayload = {
  target: string;
  associatedNames?: string[];
};

export type PrimaryNameRequestPayload = {
  name: string;
  arioProcessId: string;
};

export type RemovePrimaryNamesPayload = {
  names: string[];
  arioProcessId: string;
};

// end ant transaction payload types

export const ALL_TRANSACTION_DATA_KEYS = [
  'assetId',
  'functionName',
  'deployedTransactionId',
  'name',
  'processId',
  'years',
  'target',
  'qty',
  'ticker',
  'subDomain',
  'transactionId',
  'ttlSeconds',
  'srcCodeTransactionId',
  'initialState',
  'tags',
  'type',
];

export type TransactionDataPayload =
  | BuyRecordPayload
  | ExtendLeasePayload
  | IncreaseUndernamesPayload
  | TransferIOPayload
  | SetTickerPayload
  | SetControllerPayload
  | RemoveControllerPayload
  | SetNamePayload
  | SetRecordPayload
  | RemoveRecordPayload
  | TransferANTPayload
  | PrimaryNameRequestPayload
  | RemovePrimaryNamesPayload;

export type TransactionData = TransactionDataBasePayload &
  TransactionDataPayload;

export type TransactionDataConfig = { functionName: string; keys: string[] };

export type ARNSTableRow = {
  name: string;
  role: string;
  undernameSupport: number;
  undernameCount: string;
  undernameLimit: number;
  id: string;
  expiration: Date | string;
  status: string;
  key: string | number;
  startTimestamp: number;
};

export type ANTMetadata = {
  name: string;
  id: string;
  ticker: string;
  targetID: string;
  status: string;
  role: string;
  errors?: string[];
  key: number;
};

export type ManageANTRow = {
  attribute: string;
  value: string | number;
  editable: boolean;
  key: number;
  interactionType?: ExcludedValidInteractionType;
  isValid?: boolean;
};

export type ManageDomainRow = {
  attribute: string;
  value: string | number | boolean | JSX.Element;
  key: number;
  interactionType?: ExcludedValidInteractionType;
  isValid?: boolean;
  editable: boolean;
};

export type ANTDetails = {
  status: number;
  associatedNames: string;
  name: string;
  ticker: string;
  targetID: string;
  ttlSeconds: number;
  controllers: string;
  undernameLimit: string;
  owner: string;
  processId: string;
};
export type DomainDetails = {
  expiryDate: string | number;
  leaseDuration: string;
  associatedNames: string;
  name: string;
  ticker: string;
  processId: string;
  targetID: string;
  ttlSeconds: number;
  controllers: string;
  undernameLimit: string;
  status: string;
  owner: string;
};

export type UndernameMetadata = {
  domain?: string;
  name: string;
  targetID: string;
  ttlSeconds: number;
  status: number;
  error?: string;
  key: string;
};

export enum VALIDATION_INPUT_TYPES {
  ARWEAVE_ID = 'Is valid Arweave Transaction (TX) ID.',
  ARWEAVE_ADDRESS = 'Is likely an Arweave wallet address.',
  AO_ADDRESS = 'Is a valid AO Address.',

  UNDERNAME = 'Is a valid Undername.',
  // unfortunately we cannot use computed values in enums, so be careful if we ever modify this number
  VALID_TTL = `TTL must between ${MIN_TTL_SECONDS} and ${MAX_TTL_SECONDS} seconds`,

  VALID_ANT_NAME = `ANT name or ticker must be equal or less than 1798 characters.`,
}

export type ValidationObject = {
  name: string;
  status: boolean;
  error?: string | undefined;
};

export type ContractInteraction = {
  deployer: string;
  processId: string;
  id: string;
  valid?: boolean;
  [x: string]: any;
};

export type EthAddress = `0x${string}`;

export type AoAddress = EthAddress | ArweaveTransactionID;
