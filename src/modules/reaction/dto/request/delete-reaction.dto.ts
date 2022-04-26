import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';
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

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  @Expose()
  public reactionId: number;
}
