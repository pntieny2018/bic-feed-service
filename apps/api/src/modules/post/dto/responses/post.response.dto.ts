import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsEnum, IsUUID } from 'class-validator';
import { PageDto } from '../../../../common/dto';
import { PostPrivacy, PostStatus, PostType } from '../../../../database/models/post.model';
import { ArticleResponseDto } from '../../../article/dto/responses';
import { CommentResponseDto } from '../../../comment/dto/response';
import { LinkPreviewDto } from '../../../link-preview/dto/link-preview.dto';
import { MediaFilterResponseDto } from '../../../media/dto/response';
import { UserMentionDto } from '../../../mention/dto';
import { ReactionResponseDto } from '../../../reaction/dto/response';
import { TagResponseDto } from '../../../tag/dto/responses/tag-response.dto';
import { PostSettingDto } from '../common/post-setting.dto';
import { AudienceResponseDto } from './audience.response.dto';
import { PostSettingResponseDto } from './post-setting-response.dto';
import { UserDto } from '../../../v2-user/application';

export class CommunityResponseDto {
  @ApiProperty({
    description: 'Root Group ID',
    type: String,
  })
  @Expose()
  public id: string;

  @ApiProperty({
    description: 'Name',
    type: String,
  })
  @Expose()
  public name: string;
}

export class SeriesSimpleResponseDto {
  @ApiProperty({
    type: String,
  })
  @Expose()
  public id: string;

  @ApiProperty({
    type: String,
  })
  @Expose()
  public title: string;

  @ApiProperty({
    type: String,
  })
  @Expose()
  public createdBy?: string;

  @ApiProperty({
    type: Number,
  })
  @Expose()
  public zindex?: string;
}

export class PostResponseDto {
  @ApiProperty({
    description: 'Post ID',
    type: String,
  })
  @IsUUID()
  @Expose()
  public id: string;

  @ApiProperty({
    description: 'Content',
    type: String,
  })
  @Expose()
  public content: string;

  @ApiProperty({
    description: 'tags',
    type: [TagResponseDto],
  })
  @Expose()
  public tags?: TagResponseDto[];

  @Expose()
  public lang?: string;

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
    description: 'Array of files, images, videos',
    type: MediaFilterResponseDto,
  })
  @Expose()
  @Transform(({ value }) => {
    if (!value) {
      return {
        files: [],
        videos: [],
        images: [],
      };
    }
    return value;
  })
  public media?: MediaFilterResponseDto;

  @ApiProperty({
    description: 'Setting post',
    type: PostSettingResponseDto,
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
    description: 'To know post status',
    enum: PostStatus,
  })
  @Expose()
  @IsEnum(PostStatus)
  public status: PostStatus;

  @ApiProperty({
    description: 'Post creator information',
    type: UserDto,
  })
  @Expose()
  public actor: UserDto;

  @ApiProperty({
    type: UserMentionDto,
    example: {
      dangdiep: {
        id: 1,
        username: 'dangdiep',
        avatar: 'https://google.com',
        fullname: 'Diep Dang',
      },
      tuine: {
        id: 2,
        username: 'tuine',
        avatar: 'https://google.com',
        fullname: 'Tui Day Ne',
      },
    },
  })
  @Expose()
  @Transform(({ obj, value }) => {
    const mentions = obj.mentions;
    if (Array.isArray(mentions) && mentions.length === 0) {
      return {};
    }
    return mentions;
  })
  public mentions?: UserMentionDto;

  @ApiProperty({
    description: 'Total number of comments',
    type: Number,
    name: 'comments_count',
  })
  @Expose()
  public commentsCount: number;

  @ApiProperty({
    type: Number,
    name: 'word_count',
  })
  @Expose()
  public wordCount: number;

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
  public reactionsCount?: Record<string, number>[] | Record<string, Record<string, number>>;

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

  //@ApiProperty({ type: PageDto<CommentResponseDto>, isArray: true })
  @Expose()
  public comments?: PageDto<CommentResponseDto>;

  @ApiProperty({
    enum: PostType,
  })
  @Expose()
  public type: PostType;

  @ApiProperty({
    enum: PostPrivacy,
  })
  @Expose()
  public privacy: PostPrivacy;

  @ApiProperty({
    type: LinkPreviewDto,
    example: {
      url: 'https://beincomm.com',
      domain: 'beincomm.com',
      image: 'https://www.beincomm.com/images/bic_welcomeAd_banner.webp',
      title: 'This is title',
      description: 'This is description',
    },
    name: 'link_preview',
  })
  @Expose()
  public linkPreview?: LinkPreviewDto;

  @ApiProperty({
    type: PostResponseDto,
  })
  @Expose()
  @Transform(({ value }) => {
    if (value && value.length) {
      return value
        .sort((a, b) => {
          return (
            a.PostSeriesModel.zindex - b.PostSeriesModel.zindex ||
            a.PostSeriesModel.createdAt.getTime() - b.PostSeriesModel.createdAt.getTime()
          );
        })
        .map((item) => {
          delete item.PostSeriesModel;
          return item;
        });
    }
    return [];
  })
  public items?: ArticleResponseDto[];

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
  public isReported?: boolean;

  @ApiProperty({
    type: Boolean,
  })
  @Expose()
  public isHidden?: boolean;

  @ApiProperty({
    description: 'Series',
    type: [SeriesSimpleResponseDto],
  })
  @Expose()
  public series?: SeriesSimpleResponseDto[];

  @ApiProperty({
    description: 'Video processing',
    type: String,
  })
  @Expose()
  public videoIdProcessing?: string;

  public constructor(data: Partial<PostResponseDto>) {
    Object.assign(this, data);
  }
}
