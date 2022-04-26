import { Job } from 'bullmq';
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
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { Expose } from 'class-transformer';
import { ReactionEnum } from '../reaction.enum';

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
  ): Promise<any> {
    const queueName = `reaction:${payload.target.toString().toLowerCase()}:${payload.targetId}`;
    const redisConfig = this._configService.get<IRedisConfig>('redis');

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
        return 'Action not found !';
      },
      redisConfig
    );

    const action =
      payload instanceof CreateReactionDto ? ActionReaction.ADD : ActionReaction.REMOVE;

    const jobName = `reaction:${action}:${new Date().toISOString()}`;
    queue
      .add(
        jobName,
        {
          userDto,
          payload: payload,
          action: action,
        },
        {
          removeOnComplete: true,
          removeOnFail: false,
        }
      )
      .catch((ex) => this._logger.error(ex, ex.stack));

    return {
      action: action,
      reactionName: payload.reactionName,
      target: payload.target,
      targetId: payload.targetId,
    };
  }
}
