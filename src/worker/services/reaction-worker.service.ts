import Redis from 'ioredis';
import { Job, Worker } from 'bullmq';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { getRedisConfig } from '../../config/redis';
import { ReactionService } from '../../modules/reaction';
import { ActionReaction, JobReactionDataDto } from '../../modules/reaction/dto/request';
import { NetworkHelper } from '../../common/helpers';

@Injectable()
export class ReactionWorkerService {
  private _logger = new Logger(ReactionWorkerService.name);

  public constructor(
    @Inject(forwardRef(() => ReactionService))
    private readonly _reactionService: ReactionService
  ) {
    const redisConfig = getRedisConfig();

    const sslConfig = redisConfig.ssl
      ? {
          tls: {
            host: redisConfig.host,
            port: redisConfig.port,
            password: redisConfig.password,
          },
        }
      : {};

    const redisConnection = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      maxRetriesPerRequest: null,
      ...sslConfig,
    });
    const consumer = redisConnection.duplicate();

    consumer
      .subscribe(`${NetworkHelper.getPrivateIPs()[0]}:new_reaction_queue`)
      .catch((ex) => this._logger.error(ex, ex.stack));

    consumer.on('message', (channel, message) => {
      this.registerJob(
        message,
        async (job: Job<JobReactionDataDto>): Promise<any> => {
          if (job.data.action === ActionReaction.ADD) {
            return await this._reactionService.createReaction(
              job.data.userDto,
              job.data.payload as any
            );
          } else if (job.data.action === ActionReaction.REMOVE) {
            return await this._reactionService.deleteReaction(
              job.data.userDto,
              job.data.payload as any
            );
          }
          return 'Action not found !';
        },
        redisConnection
      );
    });
  }

  public registerJob(
    queueName: string,
    jobHandle: (...args: any[]) => any,
    redisConnection: Redis.Redis
  ): void {
    const worker = new Worker(queueName, jobHandle, {
      concurrency: 21,
      connection: redisConnection,
      sharedConnection: true,
    });

    worker.on('failed', (job, result) => {
      process.stdout.write(
        `[ReactionQueue] ${job.id} Job failed with result: ${JSON.stringify(result)} \n`
      );
    });

    worker.on('completed', (job, result) => {
      process.stdout.write(
        `[ReactionQueue] ${job.id} Job completed with result: ${JSON.stringify(result)} \n`
      );
    });
  }
}
