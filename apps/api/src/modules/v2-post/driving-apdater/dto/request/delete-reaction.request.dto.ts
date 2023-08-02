import { emoji } from 'node-emoji';
import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsUUID, ValidateIf } from 'class-validator';
import { BIC_EMOJI } from '../../../../reaction/reaction.constant';
import { REACTION_TARGET } from '../../../data-type/reaction.enum';

export class DeleteReactionRequestDto {
  @ApiProperty({ example: 'POST' })
  @IsNotEmpty()
  @Expose()
  public target: REACTION_TARGET;

  @ApiProperty({ example: 'dd41bad0-9699-493a-b8cd-c0cea072f373', name: 'target_id' })
  @IsUUID()
  @IsNotEmpty()
  @Expose({
    name: 'target_id',
  })
  public targetId: string;

  @ApiProperty({ required: false, name: 'reaction_id' })
  @IsUUID()
  @IsNotEmpty()
  @ValidateIf((object) => !object['reaction_name'] && !object['reactionName'])
  @Expose({
    name: 'reaction_id',
  })
  public reactionId?: string;

  @ApiProperty({
    example: 'smile',
    description: [...BIC_EMOJI, ...Object.keys(emoji)].join(','),
    name: 'reaction_name',
  })
  @IsNotEmpty()
  @IsIn([...BIC_EMOJI, ...Object.keys(emoji)], { message: 'Reaction not found' })
  @ValidateIf((object) => !object['reactionId'])
  @Expose({
    name: 'reaction_name',
  })
  public reactionName: string;
}
