import { IQueryResult } from '@nestjs/cqrs';
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

import { UserDto } from '../../../v2-user/application';
import { REACTION_TARGET } from '../../data-type';

export class ReactionDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public reactionName: string;

  @ApiProperty()
  public targetId: string;

  @ApiProperty()
  public target: REACTION_TARGET;

  @ApiProperty()
  public actor: UserDto;

  @ApiProperty()
  public createdAt: Date;

  public constructor(data: Partial<ReactionDto>) {
    Object.assign(this, data);
  }
}

export class ReactionListDto {
  @ApiProperty()
  public list: ReactionDto[];

  @ApiProperty({
    name: 'latest_id',
  })
  @IsUUID()
  public latestId: string;

  @ApiProperty({
    type: Number,
  })
  public limit: number;

  @ApiProperty({
    type: String,
  })
  public order?: string;

  public constructor(data: Partial<ReactionListDto>) {
    Object.assign(this, data);
  }
}

export class FindReactionsDto implements IQueryResult {
  public readonly rows: ReactionDto[];
  public readonly total: number;
  public constructor(data: Partial<FindReactionsDto>) {
    Object.assign(this, data);
  }
}
