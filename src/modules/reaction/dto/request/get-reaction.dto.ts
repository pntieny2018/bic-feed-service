import { ApiProperty } from '@nestjs/swagger';
import { ReactionEnum } from '../../reaction.enum';
import { OrderEnum } from '../../../../common/dto';

export class GetReactionDto {
  @ApiProperty()
  public reactionName: string;

  @ApiProperty()
  public targetId: number;

  @ApiProperty({
    enum: ReactionEnum,
  })
  public target: ReactionEnum;

  @ApiProperty({
    required: false,
    default: 0,
  })
  public latestId: number;

  @ApiProperty({
    required: false,
    default: 25,
  })
  public limit: number;

  @ApiProperty({
    required: false,
    default: OrderEnum.DESC,
    enum: OrderEnum,
    description: 'Order by Created At',
  })
  public order: OrderEnum;
}
