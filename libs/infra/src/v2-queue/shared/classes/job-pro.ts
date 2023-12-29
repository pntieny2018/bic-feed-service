import {
  BackoffOptions,
  Backoffs,
  Job,
  MinimalQueue,
  MoveToWaitingChildrenOpts,
  UnrecoverableError,
} from 'bullmq';
import { WorkerOptions } from 'bullmq/dist/esm/interfaces/worker-options';
import { ChainableCommander } from 'ioredis';

import { JobProJsonRaw, JobsProOptions } from '../interfaces';
import { JobProJsonSandbox } from '../types';

import { ScriptsPro } from './scripts-pro';

export class JobPro<DataType = any, ReturnType = any, NameType extends string = string> extends Job<
  DataType,
  ReturnType,
  NameType
> {
  public id: string;
  public gid: string | number;
  public opts: JobsProOptions;
  protected queue: MinimalQueue;
  protected scripts: ScriptsPro;

  public constructor(
    queue: MinimalQueue,
    /**
     * The name of the Job
     */
    name: NameType,
    /**
     * The payload for this job.
     */
    data: DataType,
    /**
     * The options object for this job.
     */
    opts?: JobsProOptions,
    id?: string
  ) {
    super(queue, name, data, opts, id);
    this.queue = queue;
    this.id = id ?? '';
    if (opts?.group?.id) {
      this.gid = opts.group.id;
    }
    this.scripts = new ScriptsPro(this.queue);
  }

  /**
   * Instantiates a Job from a JobJsonRaw object (coming from a deserialized JSON object)
   *
   * @param queue - the queue where the job belongs to.
   * @param json - the plain object containing the job.
   * @param jobId - an optional job id (overrides the id coming from the JSON object)
   * @returns
   */
  public static fromJSON<T = any, R = any, N extends string = string>(
    queue: MinimalQueue,
    json: JobProJsonRaw,
    jobId?: string
  ): JobPro<T, R, N> {
    const job = super.fromJSON(queue, json, jobId) as unknown as JobPro<T, R, N>;
    if (json.gid) {
      job.gid = json.gid;
    }
    return job;
  }

  /**
   * Prepares a job to be passed to Sandbox.
   * @returns
   */
  public asJSONSandbox(): JobProJsonSandbox {
    const json = super.asJSONSandbox();
    return Object.assign(Object.assign({}, json), { gid: this.gid });
  }

  /**
   * Moves a job to the failed queue.
   *
   * @param err - the jobs error message.
   * @param token - token to check job is locked by current worker
   * @param fetchNext - true when wanting to fetch the next job
   * @returns void
   */
  public async moveToFailed(err: Error, token: string, fetchNext?: boolean): Promise<void> {
    const client = await this.queue.client;
    const message = err?.message;
    const queue = this.queue;
    this.failedReason = message;
    let command;
    const multi = client.multi();
    this.saveStacktraceEx(multi, err);
    //
    // Check if an automatic retry should be performed
    //
    // eslint-disable-next-line @typescript-eslint/naming-convention
    let moveToFailed = false;
    let finishedOn;
    if (
      this.attemptsMade < this.opts.attempts &&
      !(err instanceof UnrecoverableError || err.name == 'UnrecoverableError') &&
      !this.discarded
    ) {
      const opts = queue.opts as WorkerOptions;
      // Check if backoff is needed
      const delay = await Backoffs.calculate(
        this.opts.backoff as BackoffOptions,
        this.attemptsMade,
        err,
        this,
        opts.settings && opts.settings.backoffStrategy
      );
      if (delay === -1) {
        moveToFailed = true;
      } else if (delay) {
        const args = this.scripts.moveToDelayedProArgs(
          this.id,
          Date.now() + delay,
          token,
          this.gid
        );
        multi['moveToDelayed'](args);
        command = 'delayed';
      } else {
        // Retry immediately
        multi['retryJob'](
          this.scripts.retryJobProArgs(this.id, !!this.opts?.lifo, this.gid, token)
        );
        command = 'retry';
      }
    } else {
      // If not, move to failed
      moveToFailed = true;
    }
    if (moveToFailed) {
      const args = this.scripts.moveToFailedArgs(
        this,
        message,
        !!this.opts?.removeOnFail,
        token,
        fetchNext
      );
      multi['moveToFinished'](args);
      command = 'failed';
      finishedOn = args[13];
    }
    const results = await multi.exec();

    if (results && results.length) {
      const anyError = results.find((result) => result[0]);

      if (anyError) {
        throw new Error(`Error "moveToFailed" with command ${command}: ${anyError}`);
      }
      const code = results[results.length - 1][1] as unknown as number;
      if (code < 0) {
        throw this.scripts.finishedErrors(code, this.id ?? '', command, 'active');
      }
    }

    if (finishedOn) {
      this.finishedOn = parseInt(finishedOn);
    }
  }

  /**
   * Moves the job to the waiting-children set.
   *
   * @param token - Token to check job is locked by current worker
   * @param opts - The options bag for moving a job to waiting-children.
   * @returns true if the job was moved
   */
  public async moveToWaitingChildren(
    token: string,
    opts?: MoveToWaitingChildrenOpts
  ): Promise<boolean> {
    return this.scripts.moveToWaitingChildrenPro(this.id, token, this.gid, opts);
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/explicit-function-return-type
  public saveStacktraceEx(multi: ChainableCommander, err: Error) {
    this.stacktrace = this.stacktrace || [];
    if (err?.stack) {
      this.stacktrace.push(err.stack);
      if (this.opts.stackTraceLimit) {
        this.stacktrace = this.stacktrace.slice(0, this.opts.stackTraceLimit);
      }
    }
    const params = {
      stacktrace: JSON.stringify(this.stacktrace),
      failedReason: err?.message,
    };

    multi.hmset(this.queue.toKey(this.id), params);
  }

  /**
   * Moves the job to the delay set.
   *
   * @param timestamp - timestamp where the job should be moved back to "wait"
   * @param token - token to check job is locked by current worker
   * @returns
   */
  public async moveToDelayed(timestamp: number, token?: string): Promise<void> {
    return this.scripts.moveToDelayedPro(this.id, timestamp, this.gid, token);
  }
}
