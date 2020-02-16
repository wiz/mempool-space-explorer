import memPool from './mempool';
import { DB } from '../database';

import { Statistic, SimpleTransaction } from '../interfaces';

class Statistics {
  protected intervalTimer: NodeJS.Timer | undefined;
  protected newStatisticsEntryCallback: Function | undefined;

  public setNewStatisticsEntryCallback(fn: Function) {
    this.newStatisticsEntryCallback = fn;
  }

  constructor() {
  }

  public startStatistics(): void {
    const now = new Date();
    const nextInterval = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(),
      Math.floor(now.getMinutes() / 1) * 1 + 1, 0, 0);
    const difference = nextInterval.getTime() - now.getTime();

    setTimeout(() => {
      this.runStatistics();
      this.intervalTimer = setInterval(() => { this.runStatistics(); }, 1 * 60 * 1000);
    }, difference);
  }

  private async runStatistics(): Promise<void> {
    const currentMempool = memPool.getMempool();
    const txPerSecond = memPool.getTxPerSecond();
    const vBytesPerSecond = memPool.getVBytesPerSecond();

    if (txPerSecond === 0) {
      return;
    }

    console.log('Running statistics');

    let memPoolArray: SimpleTransaction[] = [];
    for (const i in currentMempool) {
      if (currentMempool.hasOwnProperty(i)) {
        memPoolArray.push(currentMempool[i]);
      }
    }
    // Remove 0 and undefined
    memPoolArray = memPoolArray.filter((tx) => tx.feePerVsize);

    if (!memPoolArray.length) {
      return;
    }

    memPoolArray.sort((a, b) => a.feePerVsize - b.feePerVsize);
    const totalWeight = memPoolArray.map((tx) => tx.vsize).reduce((acc, curr) => acc + curr) * 4;
    const totalFee = memPoolArray.map((tx) => tx.fee).reduce((acc, curr) => acc + curr);

    const logFees = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 30, 40, 50, 60, 70, 80, 90, 100, 125, 150, 175, 200,
      250, 300, 350, 400, 500, 600, 700, 800, 900, 1000, 1200, 1400, 1600, 1800, 2000];

    const weightVsizeFees: { [feePerWU: number]: number } = {};

    memPoolArray.forEach((transaction) => {
      for (let i = 0; i < logFees.length; i++) {
        if ((logFees[i] === 2000 && transaction.feePerVsize >= 2000) || transaction.feePerVsize <= logFees[i]) {
          if (weightVsizeFees[logFees[i]]) {
            weightVsizeFees[logFees[i]] += transaction.vsize;
          } else {
            weightVsizeFees[logFees[i]] = transaction.vsize;
          }
          break;
        }
      }
    });

    const insertId = await this.$create({
      added: 'NOW()',
      unconfirmed_transactions: memPoolArray.length,
      tx_per_second: txPerSecond,
      vbytes_per_second: Math.round(vBytesPerSecond),
      mempool_byte_weight: totalWeight,
      total_fee: totalFee,
      fee_data: '',
      vsize_1: weightVsizeFees['1'] || 0,
      vsize_2: weightVsizeFees['2'] || 0,
      vsize_3: weightVsizeFees['3'] || 0,
      vsize_4: weightVsizeFees['4'] || 0,
      vsize_5: weightVsizeFees['5'] || 0,
      vsize_6: weightVsizeFees['6'] || 0,
      vsize_8: weightVsizeFees['8'] || 0,
      vsize_10: weightVsizeFees['10'] || 0,
      vsize_12: weightVsizeFees['12'] || 0,
      vsize_15: weightVsizeFees['15'] || 0,
      vsize_20: weightVsizeFees['20'] || 0,
      vsize_30: weightVsizeFees['30'] || 0,
      vsize_40: weightVsizeFees['40'] || 0,
      vsize_50: weightVsizeFees['50'] || 0,
      vsize_60: weightVsizeFees['60'] || 0,
      vsize_70: weightVsizeFees['70'] || 0,
      vsize_80: weightVsizeFees['80'] || 0,
      vsize_90: weightVsizeFees['90'] || 0,
      vsize_100: weightVsizeFees['100'] || 0,
      vsize_125: weightVsizeFees['125'] || 0,
      vsize_150: weightVsizeFees['150'] || 0,
      vsize_175: weightVsizeFees['175'] || 0,
      vsize_200: weightVsizeFees['200'] || 0,
      vsize_250: weightVsizeFees['250'] || 0,
      vsize_300: weightVsizeFees['300'] || 0,
      vsize_350: weightVsizeFees['350'] || 0,
      vsize_400: weightVsizeFees['400'] || 0,
      vsize_500: weightVsizeFees['500'] || 0,
      vsize_600: weightVsizeFees['600'] || 0,
      vsize_700: weightVsizeFees['700'] || 0,
      vsize_800: weightVsizeFees['800'] || 0,
      vsize_900: weightVsizeFees['900'] || 0,
      vsize_1000: weightVsizeFees['1000'] || 0,
      vsize_1200: weightVsizeFees['1200'] || 0,
      vsize_1400: weightVsizeFees['1400'] || 0,
      vsize_1600: weightVsizeFees['1600'] || 0,
      vsize_1800: weightVsizeFees['1800'] || 0,
      vsize_2000: weightVsizeFees['2000'] || 0,
    });

    if (this.newStatisticsEntryCallback && insertId) {
      const newStats = await this.$get(insertId);
      this.newStatisticsEntryCallback(newStats);
    }
  }

  private async $create(statistics: Statistic): Promise<number | undefined> {
    try {
      const connection = await DB.pool.getConnection();
      const query = `INSERT INTO statistics(
              added,
              unconfirmed_transactions,
              tx_per_second,
              vbytes_per_second,
              mempool_byte_weight,
              fee_data,
              total_fee,
              vsize_1,
              vsize_2,
              vsize_3,
              vsize_4,
              vsize_5,
              vsize_6,
              vsize_8,
              vsize_10,
              vsize_12,
              vsize_15,
              vsize_20,
              vsize_30,
              vsize_40,
              vsize_50,
              vsize_60,
              vsize_70,
              vsize_80,
              vsize_90,
              vsize_100,
              vsize_125,
              vsize_150,
              vsize_175,
              vsize_200,
              vsize_250,
              vsize_300,
              vsize_350,
              vsize_400,
              vsize_500,
              vsize_600,
              vsize_700,
              vsize_800,
              vsize_900,
              vsize_1000,
              vsize_1200,
              vsize_1400,
              vsize_1600,
              vsize_1800,
              vsize_2000
            )
            VALUES (${statistics.added}, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
               ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      const params: (string | number)[] = [
        statistics.unconfirmed_transactions,
        statistics.tx_per_second,
        statistics.vbytes_per_second,
        statistics.mempool_byte_weight,
        statistics.fee_data,
        statistics.total_fee,
        statistics.vsize_1,
        statistics.vsize_2,
        statistics.vsize_3,
        statistics.vsize_4,
        statistics.vsize_5,
        statistics.vsize_6,
        statistics.vsize_8,
        statistics.vsize_10,
        statistics.vsize_12,
        statistics.vsize_15,
        statistics.vsize_20,
        statistics.vsize_30,
        statistics.vsize_40,
        statistics.vsize_50,
        statistics.vsize_60,
        statistics.vsize_70,
        statistics.vsize_80,
        statistics.vsize_90,
        statistics.vsize_100,
        statistics.vsize_125,
        statistics.vsize_150,
        statistics.vsize_175,
        statistics.vsize_200,
        statistics.vsize_250,
        statistics.vsize_300,
        statistics.vsize_350,
        statistics.vsize_400,
        statistics.vsize_500,
        statistics.vsize_600,
        statistics.vsize_700,
        statistics.vsize_800,
        statistics.vsize_900,
        statistics.vsize_1000,
        statistics.vsize_1200,
        statistics.vsize_1400,
        statistics.vsize_1600,
        statistics.vsize_1800,
        statistics.vsize_2000,
      ];
      const [result]: any = await connection.query(query, params);
      connection.release();
      return result.insertId;
    } catch (e) {
      console.log('$create() error', e);
    }
  }

  private getQueryForDays(days: number, groupBy: number) {

    return `SELECT id, added, unconfirmed_transactions,
            AVG(tx_per_second) AS tx_per_second,
            AVG(vbytes_per_second) AS vbytes_per_second,
            AVG(vsize_1) AS vsize_1,
            AVG(vsize_2) AS vsize_2,
            AVG(vsize_3) AS vsize_3,
            AVG(vsize_4) AS vsize_4,
            AVG(vsize_5) AS vsize_5,
            AVG(vsize_6) AS vsize_6,
            AVG(vsize_8) AS vsize_8,
            AVG(vsize_10) AS vsize_10,
            AVG(vsize_12) AS vsize_12,
            AVG(vsize_15) AS vsize_15,
            AVG(vsize_20) AS vsize_20,
            AVG(vsize_30) AS vsize_30,
            AVG(vsize_40) AS vsize_40,
            AVG(vsize_50) AS vsize_50,
            AVG(vsize_60) AS vsize_60,
            AVG(vsize_70) AS vsize_70,
            AVG(vsize_80) AS vsize_80,
            AVG(vsize_90) AS vsize_90,
            AVG(vsize_100) AS vsize_100,
            AVG(vsize_125) AS vsize_125,
            AVG(vsize_150) AS vsize_150,
            AVG(vsize_175) AS vsize_175,
            AVG(vsize_200) AS vsize_200,
            AVG(vsize_250) AS vsize_250,
            AVG(vsize_300) AS vsize_300,
            AVG(vsize_350) AS vsize_350,
            AVG(vsize_400) AS vsize_400,
            AVG(vsize_500) AS vsize_500,
            AVG(vsize_600) AS vsize_600,
            AVG(vsize_700) AS vsize_700,
            AVG(vsize_800) AS vsize_800,
            AVG(vsize_900) AS vsize_900,
            AVG(vsize_1000) AS vsize_1000,
            AVG(vsize_1200) AS vsize_1200,
            AVG(vsize_1400) AS vsize_1400,
            AVG(vsize_1600) AS vsize_1600,
            AVG(vsize_1800) AS vsize_1800,
            AVG(vsize_2000) AS vsize_2000 FROM statistics GROUP BY UNIX_TIMESTAMP(added) DIV ${groupBy} ORDER BY id DESC LIMIT ${days}`;
  }

  public async $get(id: number): Promise<Statistic | undefined> {
    try {
      const connection = await DB.pool.getConnection();
      const query = `SELECT * FROM statistics WHERE id = ?`;
      const [rows] = await connection.query<any>(query, [id]);
      connection.release();
      return rows[0];
    } catch (e) {
      console.log('$list2H() error', e);
    }
  }

  public async $list2H(): Promise<Statistic[]> {
    try {
      const connection = await DB.pool.getConnection();
      const query = `SELECT * FROM statistics ORDER BY id DESC LIMIT 120`;
      const [rows] = await connection.query<any>(query);
      connection.release();
      return rows;
    } catch (e) {
      console.log('$list2H() error', e);
      return [];
    }
  }

  public async $list24H(): Promise<Statistic[]> {
    try {
      const connection = await DB.pool.getConnection();
      const query = this.getQueryForDays(120, 720);
      const [rows] = await connection.query<any>(query);
      connection.release();
      return rows;
    } catch (e) {
      return [];
    }
  }

  public async $list1W(): Promise<Statistic[]> {
    try {
      const connection = await DB.pool.getConnection();
      const query = this.getQueryForDays(120, 5040);
      const [rows] = await connection.query<any>(query);
      connection.release();
      return rows;
    } catch (e) {
      console.log('$list1W() error', e);
      return [];
    }
  }

  public async $list1M(): Promise<Statistic[]> {
    try {
      const connection = await DB.pool.getConnection();
      const query = this.getQueryForDays(120, 20160);
      const [rows] = await connection.query<any>(query);
      connection.release();
      return rows;
    } catch (e) {
      console.log('$list1M() error', e);
      return [];
    }
  }

  public async $list3M(): Promise<Statistic[]> {
    try {
      const connection = await DB.pool.getConnection();
      const query = this.getQueryForDays(120, 60480);
      const [rows] = await connection.query<any>(query);
      connection.release();
      return rows;
    } catch (e) {
      console.log('$list3M() error', e);
      return [];
    }
  }

  public async $list6M(): Promise<Statistic[]> {
    try {
      const connection = await DB.pool.getConnection();
      const query = this.getQueryForDays(120, 120960);
      const [rows] = await connection.query<any>(query);
      connection.release();
      return rows;
    } catch (e) {
      console.log('$list6M() error', e);
      return [];
    }
  }

}

export default new Statistics();
