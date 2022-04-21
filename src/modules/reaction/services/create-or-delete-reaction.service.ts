import Bull, { Job } from 'bull';
import { UserDto } from '../../auth';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IRedisConfig } from '../../../config/redis';
import { DeleteReactionService } from './delete-reaction.service';
import { CreateReactionService } from './create-reaction.service';
import { CreateReactionDto, DeleteReactionDto, JobReactionDataDto } from '../dto/request';
import { findOrRegisterQueue } from '../../../jobs';

@Injectable()
export class CreateOrDeleteReactionService {
  private _logger = new Logger(CreateOrDeleteReactionService.name);

  public constructor(
    private readonly _configService: ConfigService,
    private readonly _createReactionService: CreateReactionService,
    private readonly _deleteReactionService: DeleteReactionService
  ) {}

  public async addToQueueReaction(
    userDto: UserDto,
    payload: CreateReactionDto | DeleteReactionDto
  ): Promise<void> {
    const queueName = `reaction:${payload.target.toString().toLowerCase()}:${payload.targetId}`;
    const redisConfig = this._configService.get<IRedisConfig>('redis');
    const sslConfig = redisConfig.ssl
      ? {
          tls: {
            host: redisConfig.host,
            port: redisConfig.port,
            password: redisConfig.password,
          },
        }
      : {};
    const queue = findOrRegisterQueue(
      queueName,
      async (job: Job<JobReactionDataDto>) => {
        if (job.data.payload instanceof CreateReactionDto) {
          return await this._createReactionService.createReaction(
            job.data.userDto,
            job.data.payload
          );
        } else if (job.data.payload instanceof DeleteReactionDto) {
          return await this._deleteReactionService.deleteReaction(
            job.data.userDto,
            job.data.payload
          );
        }
        return;
      },
      {
        redis: {
          keyPrefix: redisConfig.prefix,
          host: redisConfig.host,
          port: redisConfig.port,
          password: redisConfig.password,
          ...sslConfig,
        },
      }
    );

    await queue.add(
      {
        userDto,
        payload: payload,
      },
      {
        removeOnComplete: false,
        removeOnFail: false,
      }
    );

    queue.on('failed', (job, result) => {
      this._logger.debug(
        `${job.queue.name}-${job.id} Job active with result: ${JSON.stringify(result)}`
      );
    });
    queue.on('progress', (job, result) => {
      this._logger.debug(
        `${job.queue.name}-${job.id} Job active with result: ${JSON.stringify(result)}`
      );
    });
    queue.on('completed', (job, result) => {
      this._logger.debug(
        `${job.queue.name}-${job.id} Job completed with result: ${JSON.stringify(result)}`
      );
    });
    queue.on('active', (job, result) => {
      this._logger.debug(
        `${job.queue.name}-${job.id} Job active with result: ${JSON.stringify(result)}`
      );
    });
  }
}
