const config = require('../../mempool-config.json');
import bitcoinApi from './bitcoin/electrs-api';
import { MempoolInfo, SimpleTransaction, Transaction } from '../interfaces';

class Mempool {
  private mempoolCache: any = {};
  private mempoolInfo: MempoolInfo | undefined;
  private mempoolChangedCallback: Function | undefined;

  private txPerSecondArray: number[] = [];
  private txPerSecond: number = 0;

  private vBytesPerSecondArray: any[] = [];
  private vBytesPerSecond: number = 0;

  constructor() {
    setInterval(this.updateTxPerSecond.bind(this), 1000);
  }

  public setMempoolChangedCallback(fn: Function) {
    this.mempoolChangedCallback = fn;
  }

  public getMempool(): { [txid: string]: SimpleTransaction } {
    return this.mempoolCache;
  }

  public setMempool(mempoolData: any) {
    this.mempoolCache = mempoolData;
    if (this.mempoolChangedCallback && mempoolData) {
      this.mempoolChangedCallback(mempoolData);
    }
  }

  public async updateMemPoolInfo() {
    try {
      this.mempoolInfo = await bitcoinApi.getMempoolInfo();
    } catch (err) {
      console.log('Error getMempoolInfo', err);
    }
  }

  public getMempoolInfo(): MempoolInfo | undefined {
    return this.mempoolInfo;
  }

  public getTxPerSecond(): number {
    return this.txPerSecond;
  }

  public getVBytesPerSecond(): number {
    return this.vBytesPerSecond;
  }

  public async getRawTransaction(txId: string): Promise<SimpleTransaction | false> {
    try {
      const transaction: Transaction = await bitcoinApi.getRawTransaction(txId);
      return {
        txid: transaction.txid,
        fee: transaction.fee,
        size: transaction.size,
        vsize: transaction.weight / 4,
        feePerVsize: transaction.fee / (transaction.weight / 4)
      };
    } catch (e) {
      console.log(txId + ' not found');
      return false;
    }
  }

  public async updateMempool() {
    console.log('Updating mempool');
    const start = new Date().getTime();
    let hasChange: boolean = false;
    let txCount = 0;
    try {
      const transactions = await bitcoinApi.getRawMempool();
      const diff = transactions.length - Object.keys(this.mempoolCache).length;

      for (const txid of transactions) {
        if (!this.mempoolCache[txid]) {
          const transaction = await this.getRawTransaction(txid);
          if (transaction) {
            this.mempoolCache[txid] = transaction;
            txCount++;
            this.txPerSecondArray.push(new Date().getTime());
            this.vBytesPerSecondArray.push({
              unixTime: new Date().getTime(),
              vSize: transaction.vsize,
            });
            hasChange = true;
            if (diff > 0) {
              console.log('Fetched transaction ' + txCount + ' / ' + diff);
            } else {
              console.log('Fetched transaction ' + txCount);
            }
          } else {
            console.log('Error finding transaction in mempool.');
          }
        }

        if ((new Date().getTime()) - start > config.MEMPOOL_REFRESH_RATE_MS) {
          break;
        }
      }

      // Replace mempool to clear already confirmed transactions
      const newMempool: any = {};
      transactions.forEach((tx) => {
        if (this.mempoolCache[tx]) {
          newMempool[tx] = this.mempoolCache[tx];
        } else {
          hasChange = true;
        }
      });

      this.mempoolCache = newMempool;

      if (hasChange && this.mempoolChangedCallback) {
        this.mempoolChangedCallback(this.mempoolCache);
      }

      const end = new Date().getTime();
      const time = end - start;
      console.log('Mempool updated in ' + time / 1000 + ' seconds');
    } catch (err) {
      console.log('getRawMempool error.', err);
    }
  }

  private updateTxPerSecond() {
    const nowMinusTimeSpan = new Date().getTime() - (1000 * config.TX_PER_SECOND_SPAN_SECONDS);
    this.txPerSecondArray = this.txPerSecondArray.filter((unixTime) => unixTime > nowMinusTimeSpan);
    this.txPerSecond = this.txPerSecondArray.length / config.TX_PER_SECOND_SPAN_SECONDS || 0;

    this.vBytesPerSecondArray = this.vBytesPerSecondArray.filter((data) => data.unixTime > nowMinusTimeSpan);
    if (this.vBytesPerSecondArray.length) {
      this.vBytesPerSecond = Math.round(
        this.vBytesPerSecondArray.map((data) => data.vSize).reduce((a, b) => a + b) / config.TX_PER_SECOND_SPAN_SECONDS
      );
    }
  }
}

export default new Mempool();
