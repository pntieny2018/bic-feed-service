import { emoji } from 'node-emoji';
import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ReactionEnum } from '../../reaction.enum';
import { IsIn, IsNotEmpty, IsUUID, ValidateIf } from 'class-validator';

export class DeleteReactionDto {
  @ApiProperty({ example: 'POST' })
  @IsNotEmpty()
  @Expose()
  public target: ReactionEnum;

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
  @Expose()
  @ValidateIf((object) => !object['reaction_name'] && !object['reactionName'])
  @Expose({
    name: 'reaction_id',
  })
  public reactionId?: string;

  @ApiProperty({
    example: 'smile',
    description: Object.keys(emoji).join(','),
    name: 'reaction_name',
  })
  @IsNotEmpty()
  @Expose()
  @IsIn(Object.keys(emoji), { message: 'Reaction not found' })
  @ValidateIf((object) => !object['reactionId'])
  @Expose({
    name: 'reaction_name',
  })
  public reactionName?: string;
}
