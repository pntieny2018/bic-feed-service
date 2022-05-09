import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
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
  public latestId = 0;

  @ApiProperty({
    required: false,
    default: 25,
  })
  public limit = 25;

  @ApiProperty({
    required: false,
    default: OrderEnum.DESC,
    enum: OrderEnum,
    description: 'Order by Created At',
  })
  @ApiHideProperty()
  public order: OrderEnum;
}
