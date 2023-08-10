import { QUEUES_NAME, Job, IQueueService } from '@libs/infra/queue';
import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { JobId, Queue } from 'bull';

@Injectable()
export class QueueService implements IQueueService {
  private queues: Record<string, Queue>;
  private logger = new Logger(QueueService.name);
  public constructor(
    @InjectQueue(QUEUES_NAME.QUIZ_PENDING)
    private readonly _quizPendingQueue: Queue,
    @InjectQueue(QUEUES_NAME.QUIZ_PARTICIPANT_RESULT)
    private readonly _quizParticipantQueue: Queue
  ) {
    this.queues = {
      [QUEUES_NAME.QUIZ_PENDING]: _quizPendingQueue,
      [QUEUES_NAME.QUIZ_PARTICIPANT_RESULT]: _quizParticipantQueue,
    };

    Object.values(this.queues).forEach((queue) => {
      queue.on('completed', (job) =>
        this.logger.log(
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
    this.logger.log(
      `Added ${jobs.length} jobs to queue ${queueName}: ${jobs.map((job) => job.name).join(', ')}`
    );
  }

  public async getJobById<T>(queueName: string, jobId: JobId): Promise<Job<T>> {
    const job = await this.queues[queueName].getJob(jobId);
    this.logger.log(`Get job in queue ${queueName}, jobId: ${jobId}, job: ${JSON.stringify(job)}`);
    return job;
  }

  public async killJob(queueName: string, jobId: JobId): Promise<void> {
    await this.queues[queueName].removeRepeatableByKey(jobId.toString());
    this.logger.log(`Killed job in queue ${queueName}, jobId: ${jobId}`);
  }
}
