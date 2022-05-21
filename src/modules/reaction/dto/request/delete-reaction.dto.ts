import { emoji } from 'node-emoji';
import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ReactionEnum } from '../../reaction.enum';
import { IsIn, IsNotEmpty, IsNumber, IsOptional, ValidateIf } from 'class-validator';

export class DeleteReactionDto {
  @ApiProperty({ example: 'POST' })
  @IsNotEmpty()
  @Expose()
  public target: ReactionEnum;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  @Expose()
  public targetId: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsNotEmpty()
  @Expose()
  @ValidateIf((object) => !object['reactionName'])
  public reactionId?: number;

  @ApiProperty({ example: 'smile', description: Object.keys(emoji).join(',') })
  @IsNotEmpty()
  @Expose()
  @IsIn(Object.keys(emoji), { message: 'Reaction not found' })
  @ValidateIf((object) => !object['reactionId'])
  public reactionName?: string;
}
