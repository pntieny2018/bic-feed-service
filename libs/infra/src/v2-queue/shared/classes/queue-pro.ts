import { Queue } from 'bullmq';

import { GroupStatus } from '../enum/group-status';
import { JobsProOptions, QueueProOptions } from '../interfaces';

import { JobPro } from './job-pro';
import { RedisConnectionPro } from './redis-connection-pro';
import { ScriptsPro } from './scripts-pro';

export const MAX_GROUP_DELETE_ITER = 100;

export type BulkJobProOptions = Omit<JobsProOptions, 'repeat'>;

export class QueuePro<
  DataType = any,
  ReturnType = any,
  NameType extends string = string
> extends Queue<DataType, ReturnType, NameType> {
  protected scripts: ScriptsPro;

  public constructor(name: string, opts?: QueueProOptions) {
    super(name, opts, RedisConnectionPro);
    this.scripts = new ScriptsPro(this);

    this.waitUntilReady()
      .then(async (client) => {
        if (!this.closing) {
          return client.hset(this.keys.meta, 'version', 'bullmq-pro');
        }
      })
      .catch(() => {
        // We ignore this error to avoid warnings. The error can still
        // be received by listening to event 'error'
      });
  }

  protected get Job(): typeof JobPro {
    return JobPro;
  }

  /**
   * Get library version.
   *
   * @returns the content of the meta.library field.
   */
  public async getVersion(): Promise<string> {
    const client = await this.client;
    return client.hget(this.keys.meta, 'version');
  }

  /**
   * Adds a Job to the queue.
   *
   * @param name -
   * @param data -
   * @param opts -
   */
  public async add(
    name: NameType,
    data: DataType,
    opts?: JobsProOptions
  ): Promise<JobPro<DataType, ReturnType, NameType>> {
    return super.add(name, data, opts) as unknown as Promise<
      JobPro<DataType, ReturnType, NameType>
    >;
  }

  /**
   * Adds an array of jobs to the queue. This method may be faster than adding
   * one job at a time in a sequence.
   *
   * @param jobs - The array of jobs to add to the queue. Each job is defined by 3
   * properties, 'name', 'data' and 'opts'. They follow the same signature as 'Queue.add'.
   */
  public async addBulk(
    jobs: {
      name: NameType;
      data: DataType;
      opts?: BulkJobProOptions;
    }[]
  ): Promise<JobPro<DataType, ReturnType, NameType>[]> {
    return super.addBulk(jobs) as unknown as Promise<JobPro<DataType, ReturnType, NameType>[]>;
  }

  /**
   * Get the group ids with jobs current jobs in them.
   *
   * TODO: Support group id filtering.
   */
  public async getGroups(
    start = 0,
    end = 1
  ): Promise<
    {
      id: string;
      status: GroupStatus;
    }[]
  > {
    if (end < -1) {
      throw new Error('end must be greater than -1');
    }
    const [groups, rateLimited, maxConcurrencyGroups, pausedGroups] = await this.scripts.getGroups(
      start,
      end
    );
    // Combine results into a single array
    return [
      ...(groups || []).map((group) => ({
        id: group,
        status: GroupStatus.Waiting,
      })),
      ...(rateLimited || []).map((group) => ({
        id: group,
        status: GroupStatus.Limited,
      })),
      ...(maxConcurrencyGroups || []).map((group) => ({
        id: group,
        status: GroupStatus.Maxed,
      })),
      ...(pausedGroups || []).map((group) => ({
        id: group,
        status: GroupStatus.Paused,
      })),
    ];
  }

  /**
   * Gets all the groups that are in a particular status.
   *
   * @param status - GroupStatus so we can filter by status
   * @param start - start index, used for pagination.
   * @param end - end index, used for pagination.
   * @returns  an array of objects with the group id and status.
   */
  public async getGroupsByStatus(
    status: GroupStatus,
    start?: number,
    end?: number
  ): Promise<
    {
      id: string;
      count: number;
    }[]
  > {
    if (end < -1) {
      throw new Error('end must be greater than -1');
    }
    const [groupIds = [], counts = []] = await this.scripts.getGroupsByStatus(status, start, end);
    return groupIds.map((id, index) => ({
      id,
      count: counts[index],
    }));
  }

  /**
   * Get the total number of groups with jobs in them.
   *
   */
  public async getGroupsCount(): Promise<number> {
    const { waiting, limited, maxed, paused } = await this.getGroupsCountByStatus();
    return waiting + limited + maxed + paused;
  }

  /**
   *
   * Get the total number of groups with jobs in them, in their different
   * statuses.
   *
   * @returns {
   *    waiting: number,
   *    limited: number,
   *    maxed: number,
   *    paused: number,
   * }
   *
   */
  public async getGroupsCountByStatus(): Promise<{
    waiting: number;
    limited: number;
    maxed: number;
    paused: number;
  }> {
    const client = await this.client;
    const multi = client.multi();
    multi.zcard(this.toKey('groups'));
    multi.zcard(this.toKey('groups:limit'));
    multi.zcard(this.toKey('groups:max'));
    multi.zcard(this.toKey('groups:paused'));

    const [[err1, waiting], [err2, limited], [err3, maxed], [err4, paused]] = await multi.exec();

    const err = [err1, err2, err3, err4].find((err) => !!err);

    if (err) {
      throw err;
    }
    return {
      waiting: waiting as number,
      limited: limited as number,
      maxed: maxed as number,
      paused: paused as number,
    };
  }

  /**
   * Gets the count of all the jobs belonging to any group.
   */
  public async getGroupsJobsCount(): Promise<number> {
    const client = await this.client;

    const groupsKey = this.toKey(`groups`);
    let count = 0;
    let start = 0;
    let result;
    const limit = 100;
    do {
      result = await client['getGroupsCount']([
        groupsKey,
        this.keys.wait,
        this.toKey(''),
        start,
        start + limit,
      ]);
      if (result) {
        count += result;
        start += limit + 1;
      }
    } while (result);
    return count;
  }

  /**
   * Get the given group status.
   *
   * @param groupId - The group id to get the status for.
   * @returns GroupStatus - The status of the group or null if the group does not exist.
   */
  public async getGroupStatus(groupId: string): Promise<GroupStatus> {
    const client = await this.client;
    const multi = client.multi();
    multi.zscore(this.toKey('groups'), groupId);
    multi.zscore(this.toKey('groups:limit'), groupId);
    multi.zscore(this.toKey('groups:max'), groupId);
    multi.zscore(this.toKey('groups:paused'), groupId);
    const [[err1, waiting], [err2, limited], [err3, maxed], [err4, paused]] = await multi.exec();
    if (err1 || err2 || err3 || err4) {
      throw err1 || err2 || err3 || err4;
    }
    if (waiting) {
      return GroupStatus.Waiting;
    }
    if (limited) {
      return GroupStatus.Limited;
    }
    if (maxed) {
      return GroupStatus.Maxed;
    }
    if (paused) {
      return GroupStatus.Paused;
    }
    return null;
  }

  /**
   * Get jobs that are part of a given group.
   *
   */
  public async getGroupJobs(
    groupId: string | number,
    start?: number,
    end?: number
  ): Promise<JobPro<DataType, ReturnType, NameType>[]> {
    const client = await this.client;

    const groupKey = this.toKey(`groups:${groupId}`);
    const jobIds = await client['getGroup']([
      groupKey,
      this.keys.wait,
      this.toKey(''),
      groupId,
      start,
      end,
    ]);
    return Promise.all(jobIds.map(async (jobId) => JobPro.fromId(this, jobId)));
  }

  /**
   * Gets the count of jobs inside a given group id.
   *
   * @param groupId -
   */
  public async getGroupJobsCount(groupId: string | number): Promise<number> {
    const client = await this.client;

    const groupKey = this.toKey(`groups:${groupId}`);
    return await client['getGroupCount']([groupKey, this.keys.wait, this.toKey(''), groupId]);
  }

  /**
   * Cleans all the jobs that are part of a group.
   *
   * @param groupId -
   */
  public async deleteGroup(groupId: string | number): Promise<void> {
    const client = await this.client;

    while (
      (await client['deleteGroup']([
        this.toKey(`groups:${groupId}`),
        this.toKey('groups'),
        this.keys.wait,
        this.toKey(''),
        groupId,
        MAX_GROUP_DELETE_ITER,
      ])) > 0
    ) {
      // Empty
    }
  }

  /**
   * Cleans all the groups in this queue
   *
   * @param groupId -
   */
  public async deleteGroups(): Promise<void> {
    const client = await this.client;

    while (
      !(await client['deleteGroups']([
        this.toKey('groups'),
        this.keys.wait,
        this.toKey(''),
        MAX_GROUP_DELETE_ITER,
      ]))
    ) {
      // Empty
    }
  }

  public async obliterate(opts?: { force?: boolean; count?: number }): Promise<void> {
    await this.deleteGroups();
    return super.obliterate(opts);
  }

  /**
   * Pauses the processing of a specific group globally.
   *
   * Adding jobs requires a LUA script to check first if the paused list exist
   * and in that case it will add it there instead of the wait list or group list.
   */
  public async pauseGroup(groupId: string | number): Promise<boolean> {
    return this.scripts.pauseGroup(groupId, true);
  }

  /**
   * Resumes the processing of a specific group globally.
   *
   * The method reverses the pause operation by resuming the processing of the
   * group.
   */
  public async resumeGroup(groupId: string | number): Promise<boolean> {
    return this.scripts.pauseGroup(groupId, false);
  }
}
