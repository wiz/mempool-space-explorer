export interface Transaction {
  txid: string;
  version: number;
  locktime: number;
  fee: number;
  size: number;
  weight: number;
  vin: Vin[];
  vout: Vout[];
  status: Status;
}

export interface Recent {
  txid: string;
  fee: number;
  vsize: number;
  value: number;
}

export interface Prevout {
  scriptpubkey: string;
  scriptpubkey_asm: string;
  scriptpubkey_type: string;
  scriptpubkey_address: string;
  value: number;
}

export interface Vin {
  txid: string;
  vout: number;
  prevout: Prevout;
  scriptsig: string;
  scriptsig_asm: string;
  inner_redeemscript_asm?: string;
  is_coinbase: boolean;
  sequence: any;
  witness?: string[];
  inner_witnessscript_asm?: string;
}

export interface Vout {
  scriptpubkey: string;
  scriptpubkey_asm: string;
  scriptpubkey_type: string;
  scriptpubkey_address: string;
  value: number;
}

export interface Status {
  confirmed: boolean;
  block_height?: number;
  block_hash?: string;
  block_time?: number;
}

export interface Block {
  id: string;
  height: number;
  version: number;
  timestamp: number;
  tx_count: number;
  size: number;
  weight: number;
  merkle_root: string;
  previousblockhash: string;

  medianFee?: number;
  feeRange?: number[];
}

export interface Address {
  address: string;
  chain_stats: ChainStats;
  mempool_stats: MempoolStats;
}

export interface ChainStats {
  funded_txo_count: number;
  funded_txo_sum: number;
  spent_txo_count: number;
  spent_txo_sum: number;
  tx_count: number;
}

export interface MempoolStats {
  funded_txo_count: number;
  funded_txo_sum: number;
  spent_txo_count: number;
  spent_txo_sum: number;
  tx_count: number;
}

export interface Outspend {
  spent: boolean;
  txid: string;
  vin: number;
  status: Status;
}
