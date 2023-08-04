import { emoji } from 'node-emoji';
import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ReactionEnum } from '../reaction.enum';
import { BIC_EMOJI } from '../reaction.constant';
import { IsDate, IsNotEmpty, IsNumber, IsIn, IsUUID } from 'class-validator';

export class ReactionDto {
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
  public target: ReactionEnum;

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

  @IsNotEmpty()
  @IsNumber()
  @Expose()
  public userId: string;

  @IsNotEmpty()
  @IsDate()
  @Expose()
  public createdAt?: Date;

  @IsNumber()
  @Expose()
  public reactionId: number;

  public constructor(createReactionDto: ReactionDto) {
    Object.assign(this, createReactionDto);
  }
}
