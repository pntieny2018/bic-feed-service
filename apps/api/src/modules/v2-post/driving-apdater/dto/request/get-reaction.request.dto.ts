import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { NIL as NIL_UUID } from 'uuid';
import { Expose } from 'class-transformer';
import { OrderEnum } from '../../../../../common/dto';
import { REACTION_TARGET } from '../../../data-type/reaction.enum';

export class GetReactionRequestDto {
  @ApiProperty({
    name: 'reaction_name',
  })
  @Expose({
    name: 'reaction_name',
  })
  public reactionName: string;

  @ApiProperty({
    type: String,
    example: '494d8a84-fbc3-4a8f-a8a9-530a26b2007f',
    name: 'target_id',
  })
  @IsUUID()
  @Expose({
    name: 'target_id',
  })
  public targetId: string;

  @ApiProperty({
    enum: REACTION_TARGET,
  })
  public target: REACTION_TARGET;

  @ApiProperty({
    required: false,
    default: NIL_UUID,
    name: 'latest_id',
  })
  @IsUUID()
  @Expose({
    name: 'latest_id',
  })
  @IsOptional()
  public latestId = NIL_UUID;

  @ApiProperty({
    required: false,
    default: 25,
  })
  @IsOptional()
  public limit = 25;

  @ApiProperty({
    required: false,
    default: OrderEnum.DESC,
    enum: OrderEnum,
    description: 'Order by Created At',
  })
  @IsOptional()
  @ApiHideProperty()
  public order: OrderEnum = OrderEnum.DESC;
}
