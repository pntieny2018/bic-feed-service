import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsIn, IsNotEmpty, IsUUID } from 'class-validator';
import { emoji } from 'node-emoji';
import { BIC_EMOJI } from '../../../../reaction/reaction.constant';
import { REACTION_TARGET } from '../../../data-type/reaction.enum';

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
