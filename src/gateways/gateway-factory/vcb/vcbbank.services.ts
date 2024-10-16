import * as https from 'https';
import * as crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as moment from 'moment-timezone';

import { GateType, Payment } from '../../gate.interface';
import { Gate } from '../../gates.services';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { sleep } from 'src/shards/helpers/sleep';
import { VCBLoginDto, TransactionDto } from './vcb.bank.type';
import { Encrypt } from './encrypt';
import { axios } from 'src/shards/helpers/axios';

@Injectable()
export class VCBBankService extends Gate {
  private encrypt = new Encrypt();
  private sessionId: string | null = null;
  private cif: string | null = null;
  private mobileId: string | null = null;
  private clientId: string | null = null;

  getAgent() {
    if (this.proxy != null) {
      if (this.proxy.username && this.proxy.username.length > 0) {
        return new HttpsProxyAgent(
          `${this.proxy.schema}://${this.proxy.username}:${this.proxy.password}@${this.proxy.ip}:${this.proxy.port}`,
        );
      }
      return new HttpsProxyAgent(
        `${this.proxy.schema}://${this.proxy.ip}:${this.proxy.port}`,
      );
    }
    return new https.Agent({
      secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
    });
  }

  private async makeRequest<T>(path: string, body: any) {
    const { data } = await axios.post(
      'https://digiapp.vietcombank.com.vn' + path,
      this.encrypt.encryptRequest(body),
      {
        headers: {
          'X-Request-ID':
            String(new Date().getTime()) +
            String(parseInt((100 * Math.random()).toString())),
          'X-Channel': 'Web',
          'X-Lim-ID': this.encrypt.sha256(this.config.login_id + '1236q93-@u9'),
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.5666.197 Safari/537.36',
          Accept: 'application/json',
          'Accept-Language': 'vi',
          'Content-Type': 'application/json',
          Referer: 'https://vcbdigibank.vietcombank.com.vn/',
        },
        httpsAgent: this.getAgent(),
      },
    );
    return JSON.parse(this.encrypt.decryptResponse(data)) as T;
  }
  private async login() {
    // get captcha image and convert to base64
    const captchaToken = uuidv4();
    const captcha = await axios.get(
      'https://digiapp.vietcombank.com.vn/utility-service/v2/captcha/MASS/' +
        captchaToken,
      {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
          Referer: 'https://vcbdigibank.vietcombank.com.vn/',
        },
      },
    );
    const captchaBase64 = Buffer.from(captcha.data, 'binary').toString(
      'base64',
    );
    const captchaValue = await this.captchaSolver.solveCaptcha(captchaBase64);
    if (captchaValue.length !== 5) {
      throw new Error('Captcha value is invalid');
    }

    const loginRes = await this.makeRequest<VCBLoginDto>(
      '/authen-service/v1/login',
      {
        captchaToken,
        captchaValue,
        password: this.config.password,
        user: this.config.login_id,
        browserId: this.config.device_id,
        mid: 6,
        lang: 'vi',
        E: null,
        sessionId: null,
        DT: 'Windows',
        PM: 'Chrome 126.0.0.0',
        OV: '10',
        appVersion: '',
      },
    );
    if (loginRes.code == '00' && loginRes.sessionId && loginRes.userInfo) {
      this.sessionId = loginRes.sessionId;
      this.cif = loginRes.userInfo?.cif;
      this.mobileId = loginRes.userInfo?.mobileId;
      this.clientId = loginRes.userInfo?.clientId;
    }
  }

  async getHistory(): Promise<any[]> {
    if (!this.sessionId) await this.login();

    try {
      const fromDate = moment()
        .tz('Asia/Ho_Chi_Minh')
        .subtract(this.config.get_transaction_day_limit, 'days')
        .format('DD/MM/YYYY');
      const toDate = moment().tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY');

      const data = await this.makeRequest<TransactionDto>(
        '/bank-service/v1/transaction-history',
        {
          accountNo: this.config.account,
          accountType: 'D',
          fromDate,
          toDate,
          pageIndex: 0,
          lengthInPage: this.config.get_transaction_count_limit,
          mid: 14,
          lang: 'vi',
          user: this.config.login_id,
          cif: this.cif,
          mobileId: this.mobileId,
          clientId: this.clientId,
          browserId: this.config.device_id,
          E: null,
          sessionId: this.sessionId,
          DT: 'Windows',
          PM: 'Chrome 126.0.0.0',
          OV: '10',
          appVersion: '',
        },
      );

      // PostingDate: '2024-06-28',
      // PostingTime: '050359',
      const getDate = (PostingDate: string, PostingTime: string): Date => {
        const time = PostingTime.match(/.{1,2}/g);
        return moment
          .tz(
            PostingDate + ' ' + time.join(':'),
            'YYYY-MM-DD HH:mm:ss',
            'Asia/Ho_Chi_Minh',
          )
          .toDate();
      };

      const payments = data.transactions
        .filter((t) => t.CD === '+')
        .map((t) => ({
          transaction_id: 'vcbbank-' + t.Reference,
          content: t.Description,
          amount: parseFloat(t.Amount.replaceAll(',', '')),
          date: getDate(t.PostingDate, t.PostingTime),
          gate: GateType.VCBBANK,
          account_receiver: this.config.account,
        }));

      return payments;
    } catch (error) {
      console.error('Error while fetching transaction history:', error);

      if (
        error.message.includes(
          'Client network socket disconnected before secure TLS connection was established',
        )
      ) {
        await sleep(10000);
      } else {
        this.sessionId = null;
      }

      throw new Error('Error while fetching transaction history');
    }
  }
}
