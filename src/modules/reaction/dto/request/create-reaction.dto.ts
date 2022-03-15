import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { ReactionEnum } from '../../reaction.enum';

export class CreateReactionDto {
  @ApiProperty({ name: 'reaction_name', example: 'smile' })
  @Expose({ name: 'reaction_name' })
  @IsNotEmpty()
  public reactionName: string;

  @ApiProperty({ name: 'target', example: 'POST' })
  @Expose({ name: 'target' })
  @IsNotEmpty()
  public target: ReactionEnum;

  @ApiProperty({ name: 'target_id', example: 1 })
  @Expose({ name: 'target_id' })
  @IsNumber()
  @IsNotEmpty()
  public targetId: number;

  public constructor(createReactionDto: CreateReactionDto) {
    Object.assign(this, createReactionDto);
  }
}
