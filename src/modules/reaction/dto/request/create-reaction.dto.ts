import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsIn, IsNotEmpty, IsNumber } from 'class-validator';
import { ReactionEnum } from '../../reaction.enum';
import { emoji } from 'node-emoji';

export class CreateReactionDto {
  @ApiProperty({ example: 'smile', description: Object.keys(emoji).join(',') })
  @IsNotEmpty()
  @Expose()
  @IsIn(Object.keys(emoji), { message: 'Reaction not found' })
  reactionName: string;

  @ApiProperty({ example: 'POST' })
  @IsNotEmpty()
  @Expose()
  public target: ReactionEnum;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  @Expose()
  public targetId: number;

  public constructor(createReactionDto: CreateReactionDto) {
    Object.assign(this, createReactionDto);
  }
}
