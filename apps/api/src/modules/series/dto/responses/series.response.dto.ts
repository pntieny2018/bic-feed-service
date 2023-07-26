import { ApiProperty } from '@nestjs/swagger';
import { PageDto } from '../../../../common/dto';
import { Expose, Transform } from 'class-transformer';
import { CommentResponseDto } from '../../../comment/dto/response';
import { ReactionResponseDto } from '../../../reaction/dto/response';
import { IsEnum, IsUUID } from 'class-validator';
import { AudienceResponseDto, CommunityResponseDto } from '../../../post/dto/responses';
import { MediaResponseDto } from '../../../media/dto/response';
import { PostPrivacy, PostStatus, PostType } from '../../../../database/models/post.model';
import { ItemInSeriesResponseDto } from '../../../article/dto/responses';
import { PostSettingDto } from '../../../post/dto/common/post-setting.dto';
import { PostInSeriesResponseDto } from '../../../post/dto/responses/post-in-series.response.dto';
import { UserDto } from '../../../v2-user/application';

export class SeriesResponseDto {
  @ApiProperty({
    description: 'Post ID',
    type: String,
  })
  @IsUUID()
  @Expose()
  public id: string;

  @Expose()
  public lang?: string;

  @ApiProperty({
    description: 'Title',
    type: String,
  })
  @Expose()
  public title: string;

  @ApiProperty({
    description: 'Summary',
    type: String,
  })
  @Expose()
  public summary: string;

  @ApiProperty({
    description: 'Highlight',
    type: String,
  })
  @Expose()
  public highlight?: string;

  @ApiProperty({
    description: 'title highlight',
    type: String,
  })
  @Expose()
  public titleHighlight?: string;

  @ApiProperty({
    description: 'summary highlight',
    type: String,
  })
  @Expose()
  public summaryHighlight?: string;

  @ApiProperty({
    description: 'Post creator information',
    type: UserDto,
  })
  @Expose()
  public actor: UserDto;

  @ApiProperty({
    type: Boolean,
    name: 'marked_read_post',
  })
  @Expose()
  public markedReadPost?: boolean;

  @ApiProperty({
    type: Boolean,
    name: 'isSaved',
  })
  @Expose()
  public isSaved?: boolean;

  @ApiProperty({
    description: 'Total number of comments',
    type: Number,
    name: 'comments_count',
  })
  @Expose()
  public commentsCount: number;

  @ApiProperty({
    description: 'Total users seen post',
    type: Number,
    name: 'total_users_seen',
  })
  @Expose()
  public totalUsersSeen: number;

  @ApiProperty({
    type: 'object',
    example: {
      [0]: {
        id: 1,
        username: 'dangdiep',
        avatar: 'https://google.com',
        fullname: 'Diep Dang',
      },
      [1]: {
        id: 2,
        username: 'tuine',
        avatar: 'https://google.com',
        fullname: 'Tui Day Ne',
      },
    },
    name: 'reactions_count',
  })
  @Transform(({ value }) => {
    if (value && value !== '1=' && typeof value === 'string') {
      const rawReactionsCount: string = (value as string).substring(1);
      const [s1, s2] = rawReactionsCount.split('=');
      const reactionsName = s1.split(',');
      const total = s2.split(',');
      const reactionsCount = {};
      reactionsName.forEach((v, i) => (reactionsCount[i] = { [v]: parseInt(total[i]) }));
      return reactionsCount;
    }
    if (Array.isArray(value)) {
      const reactionsCount = {};
      value.forEach((v, i) => (reactionsCount[i] = { [v.reactionName]: parseInt(v.total) }));
      return reactionsCount;
    }
    return null;
  })
  @Expose()
  public reactionsCount?: Record<string, Record<string, number>>;

  @ApiProperty({
    type: Date,
    name: 'created_at',
  })
  @Expose()
  public createdAt: Date;

  @ApiProperty({
    type: Date,
    name: 'updated_at',
  })
  @Expose()
  public updatedAt?: Date;

  @ApiProperty({
    type: Date,
    name: 'published_at',
  })
  @Expose()
  public publishedAt?: Date;

  @ApiProperty({
    type: Number,
    name: 'created_by',
  })
  @Expose()
  public createdBy: string;

  @ApiProperty({
    type: AudienceResponseDto,
  })
  @Expose()
  public audience: AudienceResponseDto;

  @ApiProperty({
    type: [ReactionResponseDto],
    name: 'owner_reactions',
  })
  @Expose()
  public ownerReactions?: ReactionResponseDto[] = [];

  @ApiProperty({
    enum: PostType,
  })
  @Expose()
  public type: PostType;

  //@ApiProperty({ type: PageDto<CommentResponseDto>, isArray: true })
  @Expose()
  public comments?: PageDto<CommentResponseDto>;

  @ApiProperty({
    type: MediaResponseDto,
    name: 'cover_media',
  })
  @Expose()
  public coverMedia?: MediaResponseDto;

  @ApiProperty({
    type: [ItemInSeriesResponseDto],
    name: 'items',
  })
  @Expose()
  public items?: ItemInSeriesResponseDto[];

  @ApiProperty({
    type: [PostInSeriesResponseDto],
    name: 'posts',
  })
  @Expose()
  public posts?: PostInSeriesResponseDto[];

  @ApiProperty({
    description: 'Setting post',
    type: PostSettingDto,
  })
  @Expose()
  @Transform(({ obj, value }) => {
    if (!value) {
      return {
        canReact: obj.canReact,
        canComment: obj.canComment,
        isImportant: obj.isImportant,
        importantExpiredAt: obj.importantExpiredAt,
      };
    }
    return value;
  })
  public setting: PostSettingDto;

  @ApiProperty({
    type: [CommunityResponseDto],
    name: 'communities',
  })
  @Expose()
  public communities?: CommunityResponseDto[];

  @ApiProperty({
    type: Boolean,
  })
  @Expose()
  public isHidden?: boolean;

  @ApiProperty({
    description: 'To know post status',
    enum: PostStatus,
  })
  @Expose()
  @IsEnum(PostStatus)
  public status: PostStatus;

  @ApiProperty({
    enum: PostPrivacy,
  })
  @Expose()
  public privacy: PostPrivacy;

  public constructor(data: Partial<SeriesResponseDto>) {
    Object.assign(this, data);
  }
}
