import { Injectable, Logger } from '@nestjs/common';
import { QUEUES } from '@app/queue/queue.constant';
import { InjectQueue } from '@nestjs/bull';
import { JobId, Queue } from 'bull';
import { Job } from './interfaces';

@Injectable()
export class QueueService {
  private queues: Record<string, Queue>;
  private logger = new Logger(QueueService.name);
  public constructor(
    @InjectQueue(QUEUES.QUIZ_PENDING.QUEUE_NAME)
    private readonly _quizPendingQueue: Queue,
    @InjectQueue(QUEUES.QUIZ_PARTICIPANT_RESULT.QUEUE_NAME)
    private readonly _quizParticipantQueue: Queue
  ) {
    this.queues = {
      [QUEUES.QUIZ_PENDING.QUEUE_NAME]: _quizPendingQueue,
      [QUEUES.QUIZ_PARTICIPANT_RESULT.QUEUE_NAME]: _quizParticipantQueue,
    };

    Object.values(this.queues).forEach((queue) => {
      queue.on('completed', (job) =>
        this.logger.debug(
          `Job ${job.id} of type ${job.name} with data ${JSON.stringify(job.data)} is successful.`
        )
      );
      queue.on('failed', (job, error) => {
        if (job.attemptsMade === job.opts.attempts) {
          this.logger.error(
            `Job ${job.id} of type ${job.name} with data ${JSON.stringify(job.data)} failed. ${
              error.message
            }`
          );
        }
      });
    });
  }

  public async addBulkJobs<T>(jobs: Job<T>[]): Promise<void> {
    if (!jobs.length) {
      return;
    }

    const queueJobMap: Record<string, Job<T>[]> = jobs.reduce((map, job) => {
      const queueName = job.queue.name;
      if (!map[queueName]) {
        map[queueName] = [];
      }
      map[queueName].push(job);
      return map;
    }, {});

    await Promise.all(
      Object.entries(queueJobMap).map(([queueName, jobs]) => this._addBulk(queueName, jobs))
    );
  }

  private async _addBulk<T>(queueName: string, jobs: Job<T>[]): Promise<void> {
    await this.queues[queueName].addBulk(jobs);
    this.logger.debug(
      `Added ${jobs.length} jobs to queue ${queueName}: ${jobs.map((job) => job.name).join(', ')}`
    );
  }

  public async getJobById<T>(queueName: string, jobId: JobId): Promise<Job<T>> {
    const job = await this.queues[queueName].getJob(jobId);
    this.logger.debug(
      `Get job in queue ${queueName}, jobId: ${jobId}, job: ${JSON.stringify(job)}`
    );
    return job;
  }

  public async killJob(queueName: string, jobId: JobId): Promise<void> {
    await this.queues[queueName].removeRepeatableByKey(jobId.toString());
    this.logger.debug(`Killed job in queue ${queueName}, jobId: ${jobId}`);
  }

  public async addQuizJob(data: unknown): Promise<void> {
    const jobName: string = QUEUES.QUIZ_PENDING.JOBS.PROCESS_QUIZ_PENDING;
    await this._quizPendingQueue.add(jobName, data);
  }
}
