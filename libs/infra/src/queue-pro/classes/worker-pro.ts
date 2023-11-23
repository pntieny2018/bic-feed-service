import { Worker } from 'bullmq';
import { from, isObservable } from 'rxjs';
import { last, switchMap, timeout } from 'rxjs/operators';

import { WorkerProOptions } from '../interfaces';

import { JobPro } from './job-pro';
import { RedisConnectionPro } from './redis-connection-pro';
import { ScriptsPro } from './scripts-pro';

export type ProcessorPro<T = any, R = any, N extends string = string> = (
  job: JobPro<T, R, N>,
  token?: string
) => Promise<R>;

export class WorkerPro<
  DataType = any,
  ResultType = any,
  NameType extends string = string
> extends Worker<DataType, ResultType, NameType> {
  public opts: WorkerProOptions;
  protected scripts: ScriptsPro;
  public static RateLimitError: typeof Worker.RateLimitError;
  public constructor(
    name: string,
    processor?: string | ProcessorPro<DataType, ResultType, NameType>,
    opts?: WorkerProOptions
  ) {
    super(
      name,
      processor,
      Object.assign(Object.assign({}, opts), { autorun: false }),
      RedisConnectionPro
    );
    if (opts.group?.limit && opts.group?.concurrency) {
      throw new Error('Rate limit and concurrency cannot be used together');
    }

    const ttlType = (ttl: unknown): ttl is number => typeof ttl === 'number';

    if (opts.ttl) {
      const ttlError = new Error('Ttl must be a positive number');
      if (ttlType(opts.ttl) && opts.ttl <= 0) {
        throw ttlError;
      } else {
        for (const ttl of Object.values(opts.ttl)) {
          if (ttl <= 0) {
            throw ttlError;
          }
        }
      }
    }

    this.scripts = new ScriptsPro(this);

    if (!opts || typeof opts.autorun === 'undefined' ? true : opts.autorun) {
      this.run().catch((error) => this.emit('error', error));
    }
  }

  protected get Job(): typeof JobPro {
    return JobPro;
  }

  protected async callProcessJob(
    job: JobPro<DataType, ResultType, NameType>,
    token: string
  ): Promise<ResultType> {
    const result = await this.processFn(job, token);
    if (isObservable(result)) {
      const observable = result;
      const pipe = [switchMap((value) => from(this.storeResult(job.id, token, value))), last()];
      if (this.opts.ttl) {
        const ttl = typeof this.opts.ttl === 'number' ? this.opts.ttl : this.opts.ttl[job.name];
        pipe.push(timeout(ttl));
      }
      // eslint-disable-next-line prefer-spread
      return observable.pipe.apply(observable, pipe).toPromise();
    } else {
      return result;
    }
  }

  /**
   * Store returnValue.
   *
   * @param jobId - Job identifier.
   * @param token - Token lock.
   * @param returnValue - The jobs success message.
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention,
  private async storeResult(jobId: string, token: string, returnValue: any): Promise<any> {
    const client = await this.connection.client;

    const result = await client['storeResult']([
      this.toKey(jobId),
      this.toKey(`${jobId}:lock`),
      token,
      JSON.stringify(returnValue),
    ]);

    if (result < 0) {
      throw this.scripts.finishedErrors(result, jobId, 'storeResult');
    }
    return returnValue;
  }

  /**
   * Overrides the rate limit so that it becomes active for the given group.
   *
   * @param job - Job currently being processed, and whose group we want to rate limit.
   * @param expireTimeMs - Expire time in ms of this rate limit.
   */
  public async rateLimitGroup(job: JobPro, expireTimeMs: number): Promise<void> {
    const opts = job.opts;
    const groupId = opts.group?.id;

    if (typeof groupId === 'undefined') {
      throw new Error('Job must have a group id');
    }

    if (expireTimeMs <= 0) {
      throw new Error('expireTimeMs must be greater than 0');
    }

    return this.scripts.rateLimitGroup(job.id, groupId, expireTimeMs);
  }
}
