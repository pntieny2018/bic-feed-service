/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { performance } from 'perf_hooks';

import {
  FinishedPropValAttribute,
  FinishedStatus,
  getParentKey,
  isRedisVersionLowerThan,
  JobState,
  KeepJobs,
  MinimalJob,
  MinimalQueue,
  MoveToWaitingChildrenOpts,
  raw2NextJobData,
  Scripts,
} from 'bullmq';
import { Packr } from 'msgpackr';

import { GroupStatus } from '../enum/group-status';
import { WorkerProOptions } from '../interfaces';

const baseTimestamp = Date.now() - performance.now();

function getTimestamp(): number {
  return baseTimestamp + performance.now();
}

const packer = new Packr({
  useRecords: false,
  encodeUndefinedAsNil: true,
});

/* eslint-disable-next-line @typescript-eslint/unbound-method */
const pack = packer.pack;

/**
 * Implementation of the Scripts interface.
 * In the future we may refactor the Scripts interface in BullMQ so that extensions
 * can just extend the Scripts implementation and replace by its own commands.
 */
export class ScriptsPro extends Scripts {
  protected queue: MinimalQueue;

  public constructor(queue: MinimalQueue) {
    super(queue);
    this.queue = queue;
  }

  public moveToDelayedProArgs(
    jobId: string,
    timestamp: number,
    token: string,
    gid: number | string
  ): (string | number)[] {
    const opts = this.queue.opts as WorkerProOptions;

    timestamp = Math.max(0, timestamp || 0);

    if (timestamp > 0) {
      timestamp = timestamp * 0x1000 + (+jobId & 0xfff);
    }

    const keys: Array<string | number> = ['wait', 'active', 'priority', 'delayed', jobId].map(
      (name) => {
        return this.queue.toKey(name);
      }
    );

    keys.push.apply(keys, [this.queue.keys.events, this.queue.keys.paused, this.queue.keys.meta]);

    return keys.concat([
      this.queue.keys[''],
      Date.now(),
      JSON.stringify(timestamp),
      jobId,
      token,
      gid,
      opts.group?.concurrency,
    ]);
  }

  public async moveToDelayedPro(
    jobId: string,
    timestamp: number,
    gid: number | string,
    token?: string
  ): Promise<void> {
    const client = await this.queue.client;

    const args = this.moveToDelayedProArgs(jobId, timestamp, token, gid);
    const result = await client['moveToDelayed'](args);
    if (result < 0) {
      throw this.finishedErrors(result, jobId, 'moveToDelayed', 'active');
    }
  }

  public retryJobProArgs(
    jobId: string,
    lifo: boolean,
    gid: number | string,
    token: string
  ): (string | number)[] {
    const opts = this.queue.opts as WorkerProOptions;

    const keys: Array<string | number> = ['', 'active', 'wait', 'paused', jobId, 'meta'].map(
      (name) => {
        return this.queue.toKey(name);
      }
    );

    keys.push(this.queue.keys.events);

    const pushCmd = (lifo ? 'R' : 'L') + 'PUSH';

    return keys.concat([pushCmd, jobId, token, gid, opts.group?.concurrency, Date.now()]);
  }

  public async moveToActive(token: string, jobId?: string): Promise<any[]> {
    const client = await this.queue.client;

    const opts = this.queue.opts as WorkerProOptions;

    const queueKeys = this.queue.keys;

    const keys: Array<unknown> = [
      queueKeys.wait,
      queueKeys.active,
      queueKeys.priority,
      queueKeys.events,
      queueKeys.stalled,
      queueKeys.limiter,
      queueKeys.delayed,
      queueKeys.paused,
      queueKeys.meta,
    ];

    const args = [
      queueKeys[''],
      Date.now(),
      jobId,
      pack({
        token,
        lockDuration: opts.lockDuration,
        limiter: opts.limiter,
        group: opts.group,
      }),
    ];
    const result = await client['moveToActive'](keys.concat(args));

    return raw2NextJobData(result);
  }

  public async promote(jobId: string): Promise<number> {
    const client = await this.queue.client;
    const keys: Array<string | number> = [
      this.queue.keys.delayed,
      this.queue.keys.wait,
      this.queue.keys.paused,
      this.queue.keys.meta,
      this.queue.keys.priority,
      this.queue.keys.events,
    ];
    const args = [this.queue.toKey(''), jobId, Date.now()];

    return client['promote'](keys.concat(args));
  }

  public async moveToCompleted(
    job: MinimalJob,
    returnValue: any,
    removeOnComplete: boolean | number | KeepJobs,
    token: string,
    fetchNext: boolean
  ): Promise<any[]> {
    return this.moveToFinished(
      job,
      returnValue,
      'returnvalue',
      removeOnComplete,
      'completed',
      token,
      fetchNext
    );
  }

  public async moveToFinished(
    job: MinimalJob,
    val: any,
    propVal: FinishedPropValAttribute,
    shouldRemove: boolean | number | KeepJobs,
    target: FinishedStatus,
    token: string,
    fetchNext: boolean
  ): Promise<any[]> {
    const client = await this.queue.client;

    const timestamp = Date.now();
    const args = this.moveToFinishedArgs(
      job,
      val,
      propVal,
      shouldRemove,
      target,
      token,
      timestamp,
      fetchNext
    );
    const result = await client['moveToFinished'](args);
    if (result < 0) {
      throw this.finishedErrors(result, job.id, 'finished', 'active');
    } else {
      job.finishedOn = timestamp;
      if (typeof result !== 'undefined') {
        return raw2NextJobData(result);
      }
    }
  }

  public moveToFailedArgs(
    job: MinimalJob,
    failedReason: string,
    removeOnFailed: boolean | number | KeepJobs,
    token: string,
    fetchNext?: boolean
  ): (string | number | boolean | Buffer)[] {
    const timestamp = Date.now();

    return this.moveToFinishedArgs(
      job,
      failedReason,
      'failedReason',
      removeOnFailed,
      'failed',
      token,
      timestamp,
      fetchNext
    );
  }

  public moveToWaitingChildrenProArgs(
    jobId: string,
    token: string,
    gid: number | string,
    opts?: MoveToWaitingChildrenOpts
  ): (string | number)[] {
    const workerOpts = this.queue.opts as WorkerProOptions;
    const timestamp = Date.now();
    const childKey = getParentKey(opts.child);
    const keys: Array<string | number> = [
      '',
      `${jobId}:lock`,
      'active',
      'waiting-children',
      jobId,
    ].map((name) => {
      return this.queue.toKey(name);
    });
    return keys.concat([
      gid,
      token,
      childKey !== null && childKey !== void 0 ? childKey : '',
      JSON.stringify(timestamp),
      jobId,
      workerOpts.group?.concurrency,
    ]);
  }

  /**
   * Move parent job to waiting-children state.
   *
   * @returns true if job is successfully moved, false if there are pending dependencies.
   * @throws JobNotExist
   * This exception is thrown if jobId is missing.
   * @throws JobLockNotExist
   * This exception is thrown if job lock is missing.
   * @throws JobNotInState
   * This exception is thrown if job is not in active state.
   */
  public async moveToWaitingChildrenPro(
    jobId: string,
    token: string,
    gid: number | string,
    opts?: MoveToWaitingChildrenOpts
  ): Promise<boolean> {
    const client = await this.queue.client;

    const args = this.moveToWaitingChildrenProArgs(jobId, token, gid, opts);
    const result = await client['moveToWaitingChildren'](args);
    switch (result) {
      case 0:
        return true;
      case 1:
        return false;
      default:
        throw this.finishedErrors(result, jobId, 'moveToWaitingChildren', 'active');
    }
  }

  public async getGroups(
    start = 0,
    end = 1
  ): Promise<
    [string[] | undefined, string[] | undefined, string[] | undefined, string[] | undefined, number]
  > {
    const client = await this.queue.client;

    return client['getGroups']([
      this.queue.toKey('groups'),
      this.queue.toKey('groups:limit'),
      this.queue.toKey('groups:max'),
      this.queue.toKey('groups:paused'),
      start,
      end,
    ]);
  }

  public async getGroupsByStatus(
    status: GroupStatus,
    start = 0,
    end = 1
  ): Promise<[string[], number[]]> {
    const client = await this.queue.client;

    const groupsKey = this.groupStatus2Key(status);
    const prefix = this.queue.toKey('groups');
    return client['getGroupsByKey']([groupsKey, prefix, start, end]);
  }

  public async getState(jobId: string): Promise<JobState | 'unknown'> {
    const client = await this.queue.client;

    const keys = [
      'completed',
      'failed',
      'delayed',
      'active',
      'wait',
      'paused',
      'waiting-children',
      '',
    ].map((key) => {
      return this.queue.toKey(key);
    });
    if (isRedisVersionLowerThan(this.queue.redisVersion, '6.0.6')) {
      return client['getState'](keys.concat([jobId]));
    }
    return client['getStateV2'](keys.concat([jobId]));
  }

  public async pauseGroup(groupId: string | number, pause: boolean): Promise<boolean> {
    const client = await this.queue.client;

    const keys: Array<string | number> = [
      '',
      'wait',
      `groups:${groupId}`,
      'groups',
      'groups:paused',
      `groups:${groupId}:limit`,
      'groups:limit',
      'groups-lid',
      'groups:max',
      'events',
    ].map((key) => {
      return this.queue.toKey(key);
    });

    const code = await client['pauseGroup'](
      keys.concat([groupId, pause ? '0' : '1', getTimestamp()])
    );

    return code === 0;
  }

  /**
   * Rate limit a group.
   *
   * @param jobId the job id that cased this group to be rate limited
   * @param groupId the group id
   * @param expirationTimeMs the expiration time in milliseconds
   * @returns
   */
  public async rateLimitGroup(
    jobId: string,
    groupId: string,
    expirationTimeMs: number
  ): Promise<void> {
    const client = await this.queue.client;

    const keys: Array<string | number> = [
      this.queue.keys.active,
      this.queue.keys.stalled,
      this.queue.toKey(`${jobId}:lock`),
      this.queue.toKey(`groups:${groupId}`),
      this.queue.toKey(`groups:${groupId}:limit`),
      this.queue.toKey(`groups:paused`),
      this.queue.toKey(`groups`),
      this.queue.toKey(`groups:limit`),
      this.queue.toKey(`wait`),
    ];

    return client['rateLimitGroup'](
      keys.concat([jobId, expirationTimeMs, Date.now(), groupId, this.queue.toKey('')])
    );
  }

  protected moveToFinishedArgs(
    job: MinimalJob,
    val: any,
    propVal: FinishedPropValAttribute,
    shouldRemove: boolean | number | KeepJobs,
    target: FinishedStatus,
    token: string,
    timestamp: number,
    fetchNext?: boolean
  ): (string | number | boolean | Buffer)[] {
    const queueKeys = this.queue.keys;
    const opts = this.queue.opts as WorkerProOptions;
    const metricsKey = this.queue.toKey(`metrics:${target}`);

    const keys: Array<string | number> = [
      queueKeys.wait,
      queueKeys.active,
      queueKeys.priority,
      queueKeys.events,
      queueKeys.stalled,
      queueKeys.limiter,
      queueKeys.delayed,
      queueKeys.paused,
      queueKeys[target],
      this.queue.toKey(job.id),
      queueKeys.meta,
      metricsKey,
    ];
    const keepJobs =
      typeof shouldRemove === 'object'
        ? shouldRemove
        : typeof shouldRemove === 'number'
        ? { count: shouldRemove }
        : { count: shouldRemove ? 0 : -1 };

    const args: Array<string | number> = [
      job.id,
      timestamp,
      propVal,
      typeof val === 'undefined' ? 'null' : val,
      target,
      JSON.stringify({ jobId: job.id, val: val }),
      !fetchNext || this.queue.closing ? 0 : 1,
      queueKeys[''],
      pack({
        token,
        keepJobs,
        limiter: opts.limiter,
        lockDuration: opts.lockDuration,
        group: opts.group,
        attempts: job.opts.attempts,
        attemptsMade: job.attemptsMade,
        maxMetricsSize: opts.metrics?.maxDataPoints ?? '',
        fpof: !!job.opts?.failParentOnFailure,
      }),
    ];

    return keys.concat(args);
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  private groupStatus2Key(status): string {
    switch (status) {
      case GroupStatus.Waiting:
        return this.queue.toKey('groups');
      case GroupStatus.Limited:
        return this.queue.toKey('groups:limit');
      case GroupStatus.Maxed:
        return this.queue.toKey('groups:max');
      case GroupStatus.Paused:
        return this.queue.toKey('groups:paused');
      default:
        throw new Error(`Invalid group status: ${status}`);
    }
  }
}
