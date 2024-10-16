
export interface ProxyConfig {
  name: string;
  schema: string;
  ip: string;
  port: string;
  username: string;
  password: string;
  change_url: string;
  change_interval_in_sec: number;
  last_change_ip: number;
}
