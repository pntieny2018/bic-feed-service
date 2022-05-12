import { emoji } from 'node-emoji';
import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ReactionEnum } from '../../reaction.enum';
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsUUID, ValidateIf } from 'class-validator';

export class DeleteReactionDto {
  @ApiProperty({ example: 'POST' })
  @IsNotEmpty()
  @Expose()
  public target: ReactionEnum;

  @ApiProperty({ example: 'dd41bad0-9699-493a-b8cd-c0cea072f373' })
  @IsUUID()
  @IsNotEmpty()
  @Expose()
  public targetId: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsNotEmpty()
  @Expose()
  @ValidateIf((object) => !object['reactionName'])
  public reactionId?: string;

  @ApiProperty({ example: 'smile', description: Object.keys(emoji).join(',') })
  @IsNotEmpty()
  @Expose()
  @IsIn(Object.keys(emoji), { message: 'Reaction not found' })
  @ValidateIf((object) => !object['reactionId'])
  public reactionName?: string;
}
