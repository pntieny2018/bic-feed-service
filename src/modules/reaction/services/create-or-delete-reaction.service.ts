import { Job } from 'bull';
import { UserDto } from '../../auth';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IRedisConfig } from '../../../config/redis';
import { DeleteReactionService } from './delete-reaction.service';
import { CreateReactionService } from './create-reaction.service';
import {
  ActionReaction,
  CreateReactionDto,
  DeleteReactionDto,
  JobReactionDataDto,
} from '../dto/request';
import { findOrRegisterQueue } from '../../../jobs';
import { REACTION_KIND_LIMIT } from '../reaction.constant';

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
        if (job.data.action === ActionReaction.ADD) {
          return await this._createReactionService.createReaction(
            job.data.userDto,
            job.data.payload as any
          );
        } else if (job.data.action === ActionReaction.REMOVE) {
          return await this._deleteReactionService.deleteReaction(
            job.data.userDto,
            job.data.payload as any
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

    queue
      .add(
        {
          userDto,
          payload: payload,
          action: payload instanceof CreateReactionDto ? ActionReaction.ADD : ActionReaction.REMOVE,
        },
        {
          removeOnComplete: true,
          removeOnFail: false,
        }
      )
      .catch((ex) => this._logger.error(ex, ex.stack));
  }
}
