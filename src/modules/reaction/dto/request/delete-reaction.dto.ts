import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, ValidateIf } from 'class-validator';
import { ReactionEnum } from '../../reaction.enum';

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
  @IsOptional()
  @ValidateIf((object) => !object['reactionName'])
  public reactionId?: number;

  @ApiProperty({ required: false })
  @IsNotEmpty()
  @Expose()
  @IsOptional()
  @ValidateIf((object) => !object['reactionId'])
  public reactionName?: string;
}
