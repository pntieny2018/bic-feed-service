import { RedisConnection, RawCommand } from 'bullmq';

import * as scripts from '../scripts';

export class RedisConnectionPro extends RedisConnection {
  public loadCommands(providedScripts?: Record<string, RawCommand>): void {
    const finalScripts = providedScripts || scripts;
    return super.loadCommands(finalScripts);
  }
}
