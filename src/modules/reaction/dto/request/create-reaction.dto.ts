import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber, IsNotEmpty } from 'class-validator';
import { ReactionEnum } from '../../reaction.enum';

export class CreateReactionDto {
  @ApiProperty({ example: 'smile' })
  @IsNotEmpty()
  @Expose()
  public reactionName: string;

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
