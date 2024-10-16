import { ProxyService } from 'src/proxy/proxy.service';
import { axios } from 'src/shards/helpers/axios';

export interface ExchangeUsdtVnd {
  updateExchangeRate(): Promise<void>;
  usdtToVnd(usdt: number): number;
}

export class BinanceP2PExchangeUsdtVnd implements ExchangeUsdtVnd {
  private exchangeRateUsdtToVnd: number = 0;
  private exchangeRateUsdtToVNdLastUpdate: number = 0;

  constructor(
    private proxyService: ProxyService,
    private proxyName?: string,
  ) {}

  async updateExchangeRate() {
    if (Date.now() - this.exchangeRateUsdtToVNdLastUpdate < 1000 * 60) {
      return;
    }

    const httpsAgent = await this.proxyService.getProxyAgent(this.proxyName);
    try {
      const { data } = await axios.post<BinanceP2PDto>(
        `https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search`,
        {
          fiat: 'VND',
          page: 1,
          rows: 10,
          transAmount: 10000000,
          tradeType: 'SELL',
          asset: 'USDT',
          countries: [],
          proMerchantAds: false,
          shieldMerchantAds: false,
          filterType: 'tradable',
          periods: [],
          additionalKycVerifyFilter: 0,
          publisherType: null,
          payTypes: ['BankTransferVietnam'],
          classifies: ['mass', 'profession'],
        },
        {
          httpsAgent,
        },
      );

      if (data.data.length === 0) {
        throw new Error('No data found');
      }

      // exchangeRateUsdtToVnd = avg price
      const priceList = data.data
        .filter((el) => el.adv.asset == 'USDT' && el.adv.fiatUnit == 'VND')
        .map((el) => +el.adv.price);
      const totalPriceList = priceList.reduce((acc, cur) => acc + cur, 0);
      const price = Math.floor(totalPriceList / priceList.length);
      if (isNaN(price) || price < 20000) {
        throw new Error('Calc exchange rate failed');
      }
      this.exchangeRateUsdtToVnd = price;

      this.exchangeRateUsdtToVNdLastUpdate = Date.now();
      console.log(
        'Updated exchange rate tether to vnd:',
        this.exchangeRateUsdtToVnd,
      );
    } catch (error: any) {
      console.error(
        'Error while fetching exchange rate: ' + error.message,
        error,
      );
      throw new Error('Error while fetching exchange rate');
    }
  }
  usdtToVnd(usdt: number): number {
    if (!this.exchangeRateUsdtToVnd) {
      throw new Error('Please call updateExchangeRate first');
    }
    return Math.floor(usdt * this.exchangeRateUsdtToVnd);
  }
}

// type binance auto gen from json
interface BinanceP2PDto {
  code: string;
  message: null;
  messageDetail: null;
  data: Datum[];
  total: number;
  success: boolean;
}

interface Datum {
  adv: Adv;
  advertiser: Advertiser;
}

interface Advertiser {
  userNo: string;
  realName: null;
  nickName: string;
  margin: null;
  marginUnit: null;
  orderCount: null;
  monthOrderCount: number;
  monthFinishRate: number;
  positiveRate: number;
  advConfirmTime: null;
  email: null;
  registrationTime: null;
  mobile: null;
  userType: string;
  tagIconUrls: any[];
  userGrade: number;
  userIdentity: string;
  proMerchant: null;
  badges: string[] | null;
  isBlocked: null;
  activeTimeInSecond: number;
}

interface Adv {
  advNo: string;
  classify: string;
  tradeType: string;
  asset: string;
  fiatUnit: string;
  advStatus: null;
  priceType: null;
  priceFloatingRatio: null;
  rateFloatingRatio: null;
  currencyRate: null;
  price: string;
  initAmount: null;
  surplusAmount: string;
  tradableQuantity: string;
  amountAfterEditing: null;
  maxSingleTransAmount: string;
  minSingleTransAmount: string;
  buyerKycLimit: null;
  buyerRegDaysLimit: null;
  buyerBtcPositionLimit: null;
  remarks: null;
  autoReplyMsg: string;
  payTimeLimit: number;
  tradeMethods: TradeMethod[];
  userTradeCountFilterTime: null;
  userBuyTradeCountMin: null;
  userBuyTradeCountMax: null;
  userSellTradeCountMin: null;
  userSellTradeCountMax: null;
  userAllTradeCountMin: null;
  userAllTradeCountMax: null;
  userTradeCompleteRateFilterTime: null;
  userTradeCompleteCountMin: null;
  userTradeCompleteRateMin: null;
  userTradeVolumeFilterTime: null;
  userTradeType: null;
  userTradeVolumeMin: null;
  userTradeVolumeMax: null;
  userTradeVolumeAsset: null;
  createTime: null;
  advUpdateTime: null;
  fiatVo: null;
  assetVo: null;
  advVisibleRet: null;
  takerAdditionalKycRequired: number;
  inventoryType: null;
  offlineReason: null;
  assetLogo: null;
  assetScale: number;
  fiatScale: number;
  priceScale: number;
  fiatSymbol: string;
  isTradable: boolean;
  dynamicMaxSingleTransAmount: string;
  minSingleTransQuantity: string;
  maxSingleTransQuantity: string;
  dynamicMaxSingleTransQuantity: string;
  commissionRate: string;
  takerCommissionRate: null;
  minTakerFee: null;
  tradeMethodCommissionRates: any[];
  launchCountry: null;
  abnormalStatusList: null;
  closeReason: null;
  storeInformation: null;
  allowTradeMerchant: null;
}

interface TradeMethod {
  payId: null;
  payMethodId: string;
  payType: null;
  payAccount: null;
  payBank: null;
  paySubBank: null;
  identifier: string;
  iconUrlColor: null;
  tradeMethodName: string;
  tradeMethodShortName: null | string | string;
  tradeMethodBgColor: string;
}
