import { Injectable } from '@nestjs/common';
import * as YAML from 'yaml';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PaymentConfigService {
  async getConfig() {
    const pathConfig = path.join(__dirname, '../../config/config.yml');
    const configText = await fs.promises.readFile(pathConfig, 'utf-8');
    const config = YAML.parse(configText);
    return config;
  }
  async getConfigPath<T>(key: 'bots' | 'webhooks' | 'gateways' | 'proxies') {
    const ymlConfig = await this.getConfig();

    const ymlWebhooks = ymlConfig[key] as {
      [key: string]: Omit<T, 'name'>;
    };

    if (!ymlWebhooks) return [];

    const webhooksConfig = Object.keys(ymlWebhooks).map((key) => ({
      name: key,
      ...ymlWebhooks[key],
    }));

    return webhooksConfig as T[];
  }
}
