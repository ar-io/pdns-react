import { ANTState, ArNSAuctionData, ArconnectSigner } from '@ar.io/sdk/web';
import { ApiConfig } from 'arweave/node/lib/api';
import type { Dispatch, SetStateAction } from 'react';
import {
  Contract,
  CustomSignature,
  InteractionResult,
  Tags,
} from 'warp-contracts';

import { ANTContract } from './services/arweave/ANTContract';
import { ArweaveTransactionID } from './services/arweave/ArweaveTransactionID';

export type ARNSRecordEntry = {
  contractTxId: string;
  startTimestamp: number;
  endTimestamp?: number;
  type: TRANSACTION_TYPES;
  undernames: number;
  purchasePrice?: number;
};

export type ARNSDomains = { [x: string]: ARNSRecordEntry };

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

export type AuctionSettings = {
  floorPriceMultiplier: number;
  startPriceMultiplier: number;
  auctionDuration: number;
  decayRate: number;
  decayInterval: number;
};

export type AuctionParameters = {
  floorPrice: number;
  startPrice: number;
  contractTxId: string;
  startHeight: number;
  endHeight: number;
  type: TRANSACTION_TYPES;
  initiator: string;
  years?: number;
};

export type Auction = ArNSAuctionData & {
  name: string;
  prices: Record<string | number, number>;
  currentPrice: number;
  isActive: boolean;
  isAvailableForAuction: boolean;
  isRequiredToBeAuctioned: boolean; // TODO: this may be optional
};

export type AuctionTableData = Pick<
  Auction,
  'name' | 'currentPrice' | 'isActive' | 'initiator' | 'type'
> & {
  closingDate: number;
};

export type ARNSContractJSON = {
  records: ARNSDomains;
  fees: { [x: number]: number };
  auctions?: {
    [x: string]: AuctionParameters;
  };
  reserved: {
    [x: string]: {
      [x: string]: string | number;
      target: string;
      endTimestamp: number;
    };
  };
  settings: {
    auctions: {
      current: string;
      history: AuctionSettings[];
    };
    [x: string]: any;
  };
  balances: { [x: string]: number };
  controllers: ArweaveTransactionID[];
  evolve: boolean | undefined;
  name: string;
  owner: ArweaveTransactionID | undefined;
  ticker: string;
  approvedANTSourceCodeTxs: string[];
};

export type ANTContractDomainRecord = {
  ttlSeconds: number;
  transactionId: string;
};

export type ANTContractJSON = ANTState & {
  controller?: string;
  evolve?: string;
};

export type ANTContractFields = keyof ANTContractJSON;

export type ARNSMapping = {
  domain: string;
  record?: ARNSRecordEntry;
  contractTxId?: ArweaveTransactionID | 'atomic';
  state?: ANTContractJSON;
  overrides?: { [x: string]: JSX.Element | string | number };
  disabledKeys?: string[];
  compact?: boolean;
  hover?: boolean;
  deployedTransactionId?: ArweaveTransactionID | string;
  mobileView?: boolean;
  bordered?: boolean;
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

// TODO: we could break this up into separate interfaces
export interface SmartweaveContractCache {
  getContractState<T extends ANTContractJSON | ARNSContractJSON>(
    contractTxId: ArweaveTransactionID,
  ): Promise<T>;
  getContractBalanceForWallet(
    contractTxId: ArweaveTransactionID,
    wallet: ArweaveTransactionID,
  ): Promise<number>;
  getContractsForWallet(
    address: ArweaveTransactionID,
    type?: 'ant', // TODO: we may broaden this for other contract types
  ): Promise<{ contractTxIds: ArweaveTransactionID[] }>;
  getContractInteractions(
    contractTxId: ArweaveTransactionID,
  ): Promise<ContractInteraction[]>;
  getPendingContractInteractions(
    contractTxId: ArweaveTransactionID,
  ): Promise<ContractInteraction[]>;
  isDomainAvailable({
    domain,
    contractTxId,
  }: {
    domain: string;
    contractTxId?: ArweaveTransactionID;
  }): Promise<boolean>;
  isDomainReserved({
    domain,
    contractTxId,
  }: {
    domain: string;
    contractTxId?: ArweaveTransactionID;
  }): Promise<{ isReserved: boolean; reservedFor?: string }>;
  isDomainInAuction({
    contractTxId,
    domain,
  }: {
    contractTxId: ArweaveTransactionID;
    domain: string;
  }): Promise<boolean>;
  getAuction({
    contractTxId,
    domain,
    type,
  }: {
    contractTxId: ArweaveTransactionID;
    domain: string;
    type?: 'lease' | 'permabuy';
  }): Promise<Auction>;
  getAuctionSettings({
    contractTxId,
  }: {
    contractTxId: ArweaveTransactionID;
  }): Promise<AuctionSettings>;
  getDomainsInAuction({
    address,
    contractTxId,
  }: {
    address?: ArweaveTransactionID;
    contractTxId: ArweaveTransactionID;
  }): Promise<string[]>;
  getRecord({
    domain,
    contractTxId,
  }: {
    domain: string;
    contractTxId?: ArweaveTransactionID;
  }): Promise<ARNSRecordEntry>;
  getTokenBalance(
    address: ArweaveTransactionID,
    contractTxId: ArweaveTransactionID,
  ): Promise<number>;
  getRecords<T extends ARNSRecordEntry | ANTContractDomainRecord>({
    contractTxId,
    filters,
    address,
  }: {
    contractTxId?: ArweaveTransactionID;
    filters: {
      // TODO: add other filters when the API supports it
      contractTxId?: ArweaveTransactionID[];
    };
    address?: ArweaveTransactionID;
  }): Promise<{ [x: string]: T }>;
  getPriceForInteraction(
    interaction: INTERACTION_PRICE_PARAMS,
    contractTxId?: ArweaveTransactionID,
  ): Promise<number>;
  buildANTContract(contractTxId: ArweaveTransactionID): Promise<ANTContract>;
  getStateField({
    contractTxId,
    field,
  }: {
    contractTxId: ArweaveTransactionID;
    field: string;
  }): Promise<any>;
}

export interface SmartweaveContractInteractionProvider {
  writeTransaction({
    walletAddress,
    contractTxId,
    payload,
    dryWrite,
    tags,
    interactionDetails,
  }: {
    walletAddress: ArweaveTransactionID;
    contractTxId: ArweaveTransactionID;
    payload: {
      function: string;
      [x: string]: any;
    };
    dryWrite?: boolean;
    tags?: Tags;
    interactionDetails?: Record<string, any>;
  }): Promise<ArweaveTransactionID | undefined>;
  unsafeWriteTransaction({
    contractTxId,
    payload,
  }: {
    contractTxId: ArweaveTransactionID;
    payload: {
      function: string;
      [x: string]: any;
    };
  }): Promise<ArweaveTransactionID | undefined>;
  deployContract({
    walletAddress,
    srcCodeTransactionId,
    initialState,
    tags,
    interactionDetails,
  }: {
    walletAddress: ArweaveTransactionID;
    srcCodeTransactionId: ArweaveTransactionID;
    initialState: ANTContractJSON;
    tags?: Tags;
    interactionDetails?: Record<string, any>;
  }): Promise<string>;
  registerAtomicName({
    walletAddress,
    registryId,
    srcCodeTransactionId,
    initialState,
    domain,
    type,
    years,
    auction,
    qty,
    isBid,
  }: {
    walletAddress: ArweaveTransactionID;
    registryId: ArweaveTransactionID;
    srcCodeTransactionId: ArweaveTransactionID;
    initialState: ANTContractJSON;
    domain: string;
    type: TRANSACTION_TYPES;
    years?: number;
    auction: boolean;
    qty?: number;
    isBid: boolean;
  }): Promise<string | undefined>;
  dryWrite({
    walletAddress,
    contract,
    payload,
  }: {
    walletAddress: ArweaveTransactionID;
    contract: Contract<any>;
    payload: {
      function: string;
      [x: string]: any;
    };
  }): Promise<InteractionResult<any, any> | undefined>;
}

export interface ArweaveWalletConnector {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getWalletAddress(): Promise<ArweaveTransactionID>;
  getGatewayConfig(): Promise<ApiConfig>;
  // TODO: remove CustomSignature and replace with ArConnectSigner once sdk is fully supported
  signer: CustomSignature;
  arconnectSigner?: ArconnectSigner;
}

export enum WALLET_TYPES {
  ARCONNECT = 'ArConnect',
  ARWEAVE_APP = 'ArweaveApp',
}

export interface KVCache {
  set(key: string, value: any): Promise<void>;
  get(key: string): Promise<any>;
  del(key: string, filter?: { key: string; value: string }): Promise<void>;
  push(key: string, value: any): Promise<void>;
  clean(): void;
}

export interface TransactionCache {
  getCachedNameTokens(address?: ArweaveTransactionID): Promise<ANTContract[]>;
  getCachedInteractions(
    contractTxId: ArweaveTransactionID,
  ): Promise<ContractInteraction[]>;
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

export interface ANTInteractionProvider {
  setOwner(id: ArweaveTransactionID): Promise<string>;
  setControllers(ids: ArweaveTransactionID[]): Promise<string>;
  setTargetId(id: ArweaveTransactionID): Promise<string>;
  setUndername(name: string): Promise<string>;
  removeUndername(name: string): Promise<string>;
}

export type SearchBarProps = {
  disabled?: boolean;
  placeholderText?: string;
};

export type SearchBarHeaderProps = {
  defaultText: string;
  isAvailable: boolean;
  isActiveAuction: boolean;
  isReserved: boolean;
  reservedFor?: ArweaveTransactionID;
  isDefault?: boolean;
  domain?: string;
  contractTxId?: ArweaveTransactionID;
};

export type SearchBarFooterProps = {
  isAvailable: boolean;
  isActiveAuction: boolean;
  isReserved: boolean;
  reservedFor?: ArweaveTransactionID;
  domain?: string;
  record?: ARNSRecordEntry;
  contractTxId?: ArweaveTransactionID;
};

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
  SET_RECORD = 'Add Record',
  EDIT_RECORD = 'Edit Record',
  SET_TARGET_ID = 'Edit Target ID',
  SET_TTL_SECONDS = 'Edit TTL Seconds',
  REMOVE_RECORD = 'Delete Record',
  TRANSFER = 'Transfer ANT',
}
export enum INTERACTION_TYPES {
  // Registry interaction types
  BUY_RECORD = 'Buy ARNS Name',
  EXTEND_LEASE = 'Extend Lease',
  INCREASE_UNDERNAMES = 'Increase Undernames',
  SUBMIT_AUCTION_BID = 'Submit Bid',

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
  INTERACTION_TYPES.BUY_RECORD,
  INTERACTION_TYPES.EXTEND_LEASE,
  INTERACTION_TYPES.SUBMIT_AUCTION_BID,
  INTERACTION_TYPES.INCREASE_UNDERNAMES,
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
};

// registry transaction payload types
export type BuyRecordPayload = {
  name: string;
  contractTxId: string;
  years?: number;
  type: TRANSACTION_TYPES;
  state?: ANTContractJSON;
  qty?: number; // the cost displayed to the user when buying a record
  auction?: boolean;
  targetId?: ArweaveTransactionID;
  isBid?: boolean;
};

export type SubmitAuctionBidPayload = {
  name: string;
  contractTxId: string;
  type?: TRANSACTION_TYPES;
  qty: number; // the bid required to start or win the auction
  state?: ANTContractJSON;
};

export type ExtendLeasePayload = {
  name: string;
  years: number;
  contractTxId?: ArweaveTransactionID;
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
  contractTxId?: string;
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
  previousRecord?: ANTContractDomainRecord;
};

export type RemoveRecordPayload = {
  subDomain: string;
};

export type TransferANTPayload = {
  target: string;
  associatedNames?: string[];
};

// end ant transaction payload types

export const ALL_TRANSACTION_DATA_KEYS = [
  'assetId',
  'functionName',
  'deployedTransactionId',
  'name',
  'contractTxId',
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
  'auction',
];

export type TransactionDataPayload =
  | BuyRecordPayload
  | SubmitAuctionBidPayload
  | ExtendLeasePayload
  | IncreaseUndernamesPayload
  | TransferIOPayload
  | SetTickerPayload
  | SetControllerPayload
  | RemoveControllerPayload
  | SetNamePayload
  | SetRecordPayload
  | RemoveRecordPayload
  | TransferANTPayload;

export type TransactionData = TransactionDataBasePayload &
  TransactionDataPayload;

export type TransactionDataConfig = { functionName: string; keys: string[] };

export interface Equatable<T> {
  equals(other: T): boolean;
}

export type ARNSTableRow = {
  name: string;
  role: string;
  undernameSupport: number;
  undernameCount: number;
  undernames: string;
  id: string;
  expiration: Date | string;
  status: number;
  key: string | number;
  hasPending: boolean;
  errors?: string[];
};

export type ANTMetadata = {
  name: string;
  id: string;
  targetID: string;
  role: string;
  status: number;
  state: ANTContractJSON;
  errors?: string[];
  key: number;
  hasPending: boolean;
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
  undernames: string;
  owner: string;
  contractTxId: string;
};
export type DomainDetails = {
  expiryDate: string | number;
  leaseDuration: string;
  associatedNames: string;
  status: number;
  name: string;
  ticker: string;
  contractTxId: string;
  targetID: string;
  ttlSeconds: number;
  controllers: string;
  undernames: string;
  owner: string;
};

export type UndernameMetadata = {
  name: string;
  targetID: string;
  ttlSeconds: string;
  status: number;
  error?: string;
  key: string;
};

export enum VALIDATION_INPUT_TYPES {
  ARWEAVE_ID = 'Is valid Arweave Transaction (TX) ID.',
  ARWEAVE_ADDRESS = 'Is likely an Arweave wallet address.',
  ARNS_NAME = 'ARNS Name.',
  UNDERNAME = 'Is a valid Undername.',
  ANT_CONTRACT_ID = 'Is a valid Arweave Name Token (ANT).',
  // unfortunately we cannot use computed values in enums, so be careful if we ever modify this number
  TRANSACTION_CONFIRMATIONS = `Has sufficient confirmations (50+).`,
  VALID_TTL = `Minimum ttl allowed is 900 and Maximum ttl allowed is 2,592,000.`,
  EMAIL = `Is a valid email`,
  SMARTWEAVE_CONTRACT = `Is a SmartWeave Contract`,
  VALID_ANT_NAME = `ANT name or ticker must be equal or less than 1798 characters.`,
}

export type ValidationObject = {
  name: string;
  status: boolean;
  error?: string | undefined;
};

export type ContractInteraction = {
  deployer: string;
  contractTxId: string;
  id: string;
  payload: {
    function: string;
    [x: string]: string | number | boolean;
  };
  valid?: boolean;
  [x: string]: any;
};

export type SmartWeaveActionInput = {
  function: string;
  [x: string]: any;
};

export type SmartWeaveActionTags = [
  {
    name: 'App-Name';
    value: 'SmartWeaveAction';
  },
  {
    name: 'Contract';
    value: string;
  },
  {
    name: 'Input';
    value: string;
  },
] &
  TransactionTag[];
