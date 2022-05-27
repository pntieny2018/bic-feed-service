import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsIn, IsNotEmpty, IsUUID } from 'class-validator';
import { ReactionEnum } from '../../reaction.enum';
import { emoji } from 'node-emoji';

export class CreateReactionDto {
  @ApiProperty({
    example: 'smile',
    description: Object.keys(emoji).join(','),
    name: 'reaction_name',
  })
  @IsNotEmpty()
  @IsIn(Object.keys(emoji), { message: 'Reaction not found' })
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

  public constructor(createReactionDto: CreateReactionDto) {
    Object.assign(this, createReactionDto);
  }
}
