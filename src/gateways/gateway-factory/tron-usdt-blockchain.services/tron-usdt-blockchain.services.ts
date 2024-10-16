import { axios } from 'src/shards/helpers/axios';
import { Injectable } from '@nestjs/common';

import { GateType, Payment } from '../../gate.interface';
import { Gate } from '../../gates.services';
import {
  BinanceP2PExchangeUsdtVnd,
  ExchangeUsdtVnd,
} from './exchange-usdt-vnd';

@Injectable()
export class TronUsdtBlockchainService extends Gate {
  private exchangeUsdtVnd: ExchangeUsdtVnd | null;
  getUsdtFromTransactionValueAndTokenDecimals(
    value: string,
    decimals: number,
  ): number {
    const usdt = +value / Math.pow(10, decimals);
    return usdt;
  }
  async getHistory(): Promise<Payment[]> {
    if (!this.exchangeUsdtVnd)
      this.exchangeUsdtVnd = new BinanceP2PExchangeUsdtVnd(
        this.proxyService,
        this.config.proxy,
      );

    try {
      await this.exchangeUsdtVnd.updateExchangeRate();
      const httpsAgent = await this.getProxyAgent();
      const transactions = await axios.get<TronTransaction>(
        `https://api.trongrid.io/v1/accounts/${this.config.account}/transactions/trc20`,
        {
          httpsAgent,
        },
      );

      const transactionFilterUsdtAndInbound = transactions.data.data.filter(
        (transaction) =>
          transaction.token_info.symbol === 'USDT' &&
          transaction.to === this.config.account,
      );

      const payments: any[] = transactionFilterUsdtAndInbound.map(
        (transaction) => {
          const usdt = this.getUsdtFromTransactionValueAndTokenDecimals(
            transaction.value,
            transaction.token_info.decimals,
          );
          const vnd = this.exchangeUsdtVnd.usdtToVnd(usdt);
          return {
            transaction_id: transaction.transaction_id,
            content: `Received ${usdt} usdt (${vnd} vnd) from ${transaction.from}`,
            amount: vnd,
            date: new Date(transaction.block_timestamp),
            gate: GateType.TRON_USDT_BLOCKCHAIN,
            account_receiver: this.config.account,
          };
        },
      );

      return payments;
    } catch (error) {
      console.error('Error while fetching transaction history:', error);
      throw new Error('Error while fetching transaction history');
    }
  }
}

interface TronTransaction {
  data: TronTransactionData[];
  success: boolean;
  meta: Meta;
}

interface Meta {
  at: number;
  page_size: number;
}

interface TronTransactionData {
  transaction_id: string;
  token_info: Tokeninfo;
  block_timestamp: number;
  from: string;
  to: string;
  type: string;
  value: string;
}

interface Tokeninfo {
  symbol: string;
  address: string;
  decimals: number;
  name: string;
}
