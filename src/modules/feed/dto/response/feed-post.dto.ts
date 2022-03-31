import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IPostReaction } from '../../../../database/models/post-reaction.model';
import { UserSharedDto } from '../../../../shared/user/dto';
import { PostContentDto } from '../../../post/dto/common/post-content.dto';
import { PostSettingDto } from '../../../post/dto/common/post-setting.dto';

export class FeedPostDto {
  @ApiProperty({
    description: 'Post ID',
    type: Number,
  })
  @Expose()
  public id: number;

  @ApiProperty({
    description: 'Keyword search',
    type: String,
  })
  @Expose()
  public data: PostContentDto;

  @ApiProperty({
    description: 'Setting post',
    type: PostSettingDto,
  })
  @Expose()
  public setting: PostSettingDto;

  @ApiProperty({
    description: 'To know draft post or not',
    type: Boolean,
  })
  @Expose()
  public isDraft: boolean;

  @ApiProperty({
    description: 'Post creator information',
    type: UserSharedDto,
  })
  @Expose()
  @Type(() => UserSharedDto)
  public actor: UserSharedDto;

  @ApiProperty({
    description: 'Array of user',
    type: UserSharedDto,
  })
  @Expose()
  public mentions: UserSharedDto[];

  @ApiProperty({
    description: 'Total number of comments',
    type: Number,
  })
  @Expose()
  public commentsCount: number;

  @ApiProperty({
    description: 'Array of reaction count',
    type: Boolean,
  })
  @Expose()
  public reactionsCount: Record<string, Record<string, number>>;

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
