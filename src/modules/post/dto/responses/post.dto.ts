import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { PageDto } from '../../../../common/dto';
import { IPostReaction } from '../../../../database/models/post-reaction.model';
import { UserSharedDto } from '../../../../shared/user/dto';
import { CommentResponseDto } from '../../../comment/dto/response/comment.response.dto';
import { PostContentDto } from '../../../post/dto/common/post-content.dto';
import { PostSettingDto } from '../../../post/dto/common/post-setting.dto';
import { ReactionResponseDto } from '../../../reaction/dto/response';
import { AudienceDto } from '../common/audience.dto';

export class PostResponseDto {
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
  public commentCount: number;

  @ApiProperty({
    type: 'object',
    additionalProperties: {
      type: 'object',
    },
  })
  @Transform(({ value }) => {
    if (value && value !== '1=') {
      const rawReactionsCount: string = (value as string).substring(1);
      const [s1, s2] = rawReactionsCount.split('=');
      const reactionsName = s1.split(',');
      const total = s2.split(',');
      const reactionsCount = {};
      reactionsName.forEach((v, i) => (reactionsCount[i] = { [v]: parseInt(total[i]) }));
      return reactionsCount;
    }
    return null;
  })
  @Expose()
  public reactionsCount?: Record<string, Record<string, number>>;

  @ApiProperty({
    type: Date,
  })
  @Expose()
  public createdAt: Date;

  @ApiProperty({
    type: AudienceDto,
  })
  @Expose()
  public audience: AudienceDto;

  @ApiProperty({
    type: [ReactionResponseDto],
  })
  @Expose()
  public ownerReactions?: ReactionResponseDto[] = [];

  //@ApiProperty({ type: PageDto<CommentResponseDto>, isArray: true })
  @Expose()
  public comments: PageDto<CommentResponseDto>;
}
