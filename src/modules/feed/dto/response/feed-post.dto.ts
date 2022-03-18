import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IPostReaction } from 'src/database/models/post-reaction.model';
import { PostResponseDto } from 'src/modules/post/dto/responses';

export class FeedPostDto extends PostResponseDto {
  @ApiProperty({
    type: Date,
  })
  @Expose()
  public createdAt: Date;

  @ApiProperty({
    type: Object,
  })
  @Expose()
  public audience: { groups: number[] };

  @ApiProperty({ type: Array })
  @Expose()
  public ownerReactions: IPostReaction[];
}
