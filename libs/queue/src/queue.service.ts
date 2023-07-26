import { Injectable, Logger } from '@nestjs/common';
import { QUEUES } from '@app/queue/queue.constant';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class QueueService {
  private queues: Record<string, Queue>;
  private logger = new Logger(QueueService.name);
  public constructor(
    @InjectQueue(QUEUES.QUIZ_PENDING.QUEUE_NAME)
    private readonly _quizPendingQueue: Queue
  ) {
    this.queues = {
      [QUEUES.QUIZ_PENDING.QUEUE_NAME]: _quizPendingQueue,
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

  public async addQuizJob(data: unknown): Promise<void> {
    const jobName: string = QUEUES.QUIZ_PENDING.JOBS.PROCESS_QUIZ_PENDING;
    await this._quizPendingQueue.add(jobName, data);
  }
}
