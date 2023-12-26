import { setTimeout } from 'timers/promises';

import { Injectable, Logger } from '@nestjs/common';
import { Cluster, Redis } from 'ioredis';
import Redlock, { Lock } from 'redlock';

import { RedisService } from '../redis';

const LOG_CONTEXT = 'DistributedLock';

@Injectable()
export class DistributedLockService {
  public distributedLock: Redlock;
  public lockCounter = {};
  public shuttingDown = false;

  public constructor(private _storeService: RedisService) {
    this.startup(this._storeService.getClient());
  }

  public startup(
    client: Redis | Cluster,
    settings = {
      driftFactor: 0.01,
      retryCount: 10,
      retryDelay: 200,
      retryJitter: 200,
    }
  ): void {
    if (this.distributedLock) {
      return;
    }

    if (client) {
      this.distributedLock = new Redlock([client], settings);
      Logger.verbose('Redlock started', LOG_CONTEXT);

      /**
       * https://github.com/mike-marcacci/node-redlock/blob/dc7bcd923f70f66abc325d23ae618f7caf01ad75/src/index.ts#L192
       *
       * Because Redlock is designed for high availability, it does not care if
       * a minority of redis instances/clusters fail at an operation.
       *
       * However, it can be helpful to monitor and log such cases. Redlock emits
       * an "error" event whenever it encounters an error, even if the error is
       * ignored in its normal operation.
       *
       * This function serves to prevent Node's default behavior of crashing
       * when an "error" event is emitted in the absence of listeners.
       */
      this.distributedLock.on('error', (error) => {
        Logger.error(error, LOG_CONTEXT);
      });
    }
  }

  public isDistributedLockEnabled(): boolean {
    if (!this.distributedLock) {
      Logger.log('Distributed lock service is not enabled', LOG_CONTEXT);

      return false;
    } else {
      return true;
    }
  }

  public areAllLocksReleased(): boolean {
    return Object.values(this.lockCounter).every((value) => !value);
  }

  public async shutdown(): Promise<void> {
    if (this.distributedLock) {
      while (!this.areAllLocksReleased()) {
        await setTimeout(250);
      }

      if (!this.shuttingDown) {
        try {
          Logger.verbose('Redlock starting to shut down', LOG_CONTEXT);
          this.shuttingDown = true;
          await this.distributedLock.quit();
        } catch (error: any) {
          Logger.verbose(`Error quiting redlock: ${error.message}`, LOG_CONTEXT);
        } finally {
          this.shuttingDown = false;
          this.distributedLock = undefined;
          Logger.verbose('Redlock shutdown', LOG_CONTEXT);
        }
      }
    }
  }

  public async applyLock(resource: string, ttl: number): Promise<Lock> {
    Logger.verbose(`Lock ${resource} will be acquired for ${ttl} ms`, LOG_CONTEXT);
    return this.distributedLock.acquire([resource], ttl);
  }

  public async releaseLock(resource: string, lock: Lock): Promise<void> {
    try {
      await lock.release();
      Logger.debug(`Lock ${resource} has released`, LOG_CONTEXT);
    } catch (error: any) {
      Logger.error(`Releasing lock ${resource} threw an error: ${error.message}`, LOG_CONTEXT);
    }
  }
}
