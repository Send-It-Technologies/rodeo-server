import type { Address, Hex } from "thirdweb";

export type Env = {
  // DATABASE_URL removed as we no longer use database tables
  ENGINE_INSTANCE_URL: string;
  ENGINE_AUTH_TOKEN: string;
  ENGINE_WALLET_ADDRESS: string;
  THIRDWEB_SECRET_KEY: string;
  ZRX_API_KEY: string;
  PRIVY_APP_ID: string;
  PRIVY_APP_SECRET: string;
};

export type EngineTxReceipt = {
  to: Address;
  from: Address;
  contractAddress: Address | null;
  transactionIndex: number;
  gasUsed: string;
  logsBloom: Hex;
  blockHash: Hex;
  transactionHash: Hex;
  logs: EngineTxReceiptLog[];
  blockNumber: number;
  confirmations: number;
  cumulativeGasUsed: string;
  effectiveGasPrice: "string";
  status: number;
  type: number;
  byzantium: boolean;
};

export type EngineTxReceiptLog = {
  transactionIndex: number;
  blockNumber: number;
  transactionHash: Hex;
  address: Hex;
  topics: Hex[];
  data: Hex;
  logIndex: number;
  blockHash: Hex;
};
