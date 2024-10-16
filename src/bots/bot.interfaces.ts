export enum BotType {
  TELEGRAM = 'TELEGRAM',
  DISCORD = 'DISCORD',
}
export interface BotConfig {
  name: string;
  type: BotType;
  chat_chanel_id: string;
  token: string;
  conditions: {
    content_regex: string;
    account_regex: string;
  };
  admin_ids?: string[];
}
