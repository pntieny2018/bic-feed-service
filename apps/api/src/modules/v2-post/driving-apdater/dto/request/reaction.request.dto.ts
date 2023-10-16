import { ORDER } from '@beincom/constants';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsIn, IsNotEmpty, IsOptional, IsUUID, ValidateIf } from 'class-validator';
import { emoji } from 'node-emoji';
import { NIL as NIL_UUID } from 'uuid';

import { BIC_EMOJI } from '../../../../reaction/reaction.constant';
import { REACTION_TARGET } from '../../../data-type';

export class CreateReactionRequestDto {
  @ApiProperty({
    example: 'smile',
    description: [...BIC_EMOJI, ...Object.keys(emoji)].join(','),
    name: 'reaction_name',
  })
  @IsNotEmpty()
  @IsIn([...BIC_EMOJI, ...Object.keys(emoji)], { message: 'Reaction not found' })
  @Expose({
    name: 'reaction_name',
  })
  public reactionName: string;

  @ApiProperty({ example: 'POST' })
  @IsNotEmpty()
  public target: REACTION_TARGET;

  @ApiProperty({
    type: String,
    example: 'dd41bad0-9699-493a-b8cd-c0cea072f373',
    name: 'target_id',
  })
  @IsUUID()
  @IsNotEmpty()
  @Expose({
    name: 'target_id',
  })
  public targetId: string;

  public constructor(createReactionDto: CreateReactionRequestDto) {
    Object.assign(this, createReactionDto);
  }
}

export class DeleteReactionRequestDto {
  @ApiProperty({ example: 'POST' })
  @IsNotEmpty()
  @Expose()
  public target: REACTION_TARGET;

  @ApiProperty({ example: 'dd41bad0-9699-493a-b8cd-c0cea072f373', name: 'target_id' })
  @IsUUID()
  @IsNotEmpty()
  @Expose({
    name: 'target_id',
  })
  public targetId: string;

  @ApiProperty({ required: false, name: 'reaction_id' })
  @IsUUID()
  @IsNotEmpty()
  @ValidateIf((object) => !object['reaction_name'] && !object['reactionName'])
  @Expose({
    name: 'reaction_id',
  })
  public reactionId?: string;

  @ApiProperty({
    example: 'smile',
    description: [...BIC_EMOJI, ...Object.keys(emoji)].join(','),
    name: 'reaction_name',
  })
  @IsNotEmpty()
  @IsIn([...BIC_EMOJI, ...Object.keys(emoji)], { message: 'Reaction not found' })
  @ValidateIf((object) => !object['reactionId'])
  @Expose({
    name: 'reaction_name',
  })
  public reactionName: string;
}

export class GetReactionRequestDto {
  @ApiProperty({
    name: 'reaction_name',
  })
  @Expose({
    name: 'reaction_name',
  })
  public reactionName: string;

  @ApiProperty({
    type: String,
    example: '494d8a84-fbc3-4a8f-a8a9-530a26b2007f',
    name: 'target_id',
  })
  @IsUUID()
  @Expose({
    name: 'target_id',
  })
  public targetId: string;

  @ApiProperty({
    enum: REACTION_TARGET,
  })
  public target: REACTION_TARGET;

  @ApiProperty({
    required: false,
    default: NIL_UUID,
    name: 'latest_id',
  })
  @IsUUID()
  @Expose({
    name: 'latest_id',
  })
  @IsOptional()
  public latestId = NIL_UUID;

  @ApiProperty({
    required: false,
    default: 25,
  })
  @IsOptional()
  public limit = 25;

  @ApiProperty({
    required: false,
    default: ORDER.DESC,
    enum: ORDER,
    description: 'Order by Created At',
  })
  @IsOptional()
  @ApiHideProperty()
  public order: ORDER = ORDER.DESC;
}
