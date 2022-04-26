import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsIn, IsNotEmpty, IsNumber, IsOptional, ValidateIf } from 'class-validator';
import { ReactionEnum } from '../../reaction.enum';
import { emoji } from 'node-emoji';

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

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  @Expose()
  @IsOptional()
  @ValidateIf((object) => !object['reactionName'])
  public reactionId?: number;

  @ApiProperty({ example: 'smile', description: Object.keys(emoji).join(',') })
  @IsNotEmpty()
  @Expose()
  @IsIn(Object.keys(emoji), { message: 'Reaction not found' })
  @IsOptional()
  @ValidateIf((object) => !object['reactionId'])
  public reactionName?: string;
}
