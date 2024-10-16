export interface VCBLoginDto {
  mid: string;
  code: string;
  des: string;
  sessionId?: string;
  clientIp?: string;
  accessKey?: string;
  userInfo?: UserInfo;
  durationExpire: string;
  futureTransferLimitDay: string;
  recurringTransferLimitDay: string;
  useFakeId: string;
  defaultGreetingCode: string;
  isUserLoyalty: string;
  durationWaiting: string;
  ottKey: string;
  tags: any[];
  isRegistedOTT: boolean;
}

interface UserInfo {
  username: string;
  cusId: string;
  mobileNo: string;
  cif: string;
  cusName: string;
  cusEmail: string;
  cusEmailSeq: string;
  createUser: string;
  updateUser: string;
  confirmUser: string;
  resetPassDate: string;
  defaultAccount: string;
  defaultAccountNew: string;
  defaultAccountType: string;
  defaultAccountCcy: string;
  defaultAccountBranchCode: string;
  status: string;
  cusAddr: string;
  cusIdNumber: string;
  idType: string;
  issueDate: string;
  birthday: string;
  sex: string;
  cusType: string;
  cusResident: string;
  numConfirmOtp: string;
  numOtpActSoft: string;
  otpMethod: string;
  mobileId: string;
  clientId: string;
  registChannel: string;
  createdDate: string;
  receiverOTP: string;
  lastLogin: string;
  crossLogin: string;
  isActiveSMS: string;
  isLockedWeb: string;
  isLockedMB: string;
  channelId: string;
  emailSettings: string;
  pkgCode: string;
  branchCode: string;
  maxBalanceSubService: string;
  isPilot: string;
  isPilotSoftOTP: string;
  isPilotAtmDraw: string;
  isPilotVCBSmartApp: string;
  listChannel: ListChannel[];
  lockSession: boolean;
  omniSession: boolean;
  sessionId: string;
  lastUsed: string;
  converted: boolean;
  useVCBSoft: string;
  hasOldSoft: string;
  validateLuckyAcc: boolean;
  validateOpenLoanFD: boolean;
  validateOpenAliasAcc: boolean;
  failTime: number;
  isCheckCard: string;
  checkVipTime: string;
  cusLevel: string;
  custClass: string;
  acceptD13CollInfo: string;
  acceptHdgdat: string;
  cvpTheme: string;
  bestCVP: string;
  ottKey: string;
  facepayVerified: string;
  validSMSOTP: boolean;
  validIssue: boolean;
}

interface ListChannel {
  channel: string;
  channelId: string;
  lastLogin: string;
  isLocked: string;
  otpMethod: string;
  numConfirmOTP: string;
  numOtpActSoft: string;
  appVer?: string;
  ov?: string;
  methodOTP: string;
  os?: string;
  imei?: string;
  deviceType?: string;
  touchPin?: string;
  touchId?: string;
}

export interface TransactionDto {
  mid: string;
  code: string;
  des: string;
  clientIp: string;
  transactions: VCBTransaction[];
  nextIndex: string;
}

interface VCBTransaction {
  tranDate: string;
  curCode: string;
  TransactionDate: string;
  Reference: string;
  CD: string;
  Amount: string;
  Description: string;
  PCTime: string;
  DorCCode: string;
  EffDate: string;
  PostingDate: string;
  PostingTime: string;
  Remark: string;
  SeqNo: string;
  TnxCode: string;
  Teller: string;
}
