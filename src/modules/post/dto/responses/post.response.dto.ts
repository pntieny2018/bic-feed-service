import { ApiProperty } from '@nestjs/swagger';
import { MediaService } from '../../../media';
import { PageDto } from '../../../../common/dto';
import { UserMentionDto } from '../../../mention/dto';
import { PostSettingDto } from '../common/post-setting.dto';
import { Expose, Transform, Type } from 'class-transformer';
import { UserSharedDto } from '../../../../shared/user/dto';
import { AudienceResponseDto } from './audience.response.dto';
import { CommentResponseDto } from '../../../comment/dto/response';
import { MediaFilterResponseDto } from '../../../media/dto/response';
import { ReactionResponseDto } from '../../../reaction/dto/response';
import { IsUUID } from 'class-validator';
import { PostSettingResponseDto } from './post-setting-response.dto';
import { PostPrivacy } from '../../../../database/models/post.model';
import { LinkPreviewDto } from '../../../link-preview/dto/link-preview.dto';

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

  @Expose()
  public lang?: string;

  @ApiProperty({
    description: 'Highlight',
    type: String,
  })
  @Expose()
  public highlight?: string;

  @ApiProperty({
    description: 'Array of files, images, videos',
    type: MediaFilterResponseDto,
  })
  @Expose()
  @Transform(({ value }) => {
    if (
      typeof value === 'object' &&
      value.hasOwnProperty('files') &&
      value.hasOwnProperty('images') &&
      value.hasOwnProperty('videos')
    ) {
      return value;
    }
    if (value && value.length) {
      return MediaService.filterMediaType(value);
    }
    return new MediaFilterResponseDto([], [], []);
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
        canShare: obj.canShare,
        isImportant: obj.isImportant,
        importantExpiredAt: obj.importantExpiredAt,
      };
    }
    return value;
  })
  public setting: PostSettingDto;

  @ApiProperty({
    description: 'To know draft post or not',
    type: Boolean,
    name: 'is_draft',
  })
  @Expose()
  public isDraft: boolean;

  @ApiProperty({
    description: 'To know post is processing',
    type: Boolean,
  })
  @Expose()
  public isProcessing: boolean;

  @ApiProperty({
    description: 'Post creator information',
    type: UserSharedDto,
  })
  @Expose()
  @Type(() => UserSharedDto)
  public actor: UserSharedDto;

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
  public mentions?: UserMentionDto;

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
      reactionsName.forEach((v, i) => {
        if (!isNaN(parseInt(v))) {
          v = `+${v}`;
        }
        reactionsCount[i] = { [v]: parseInt(total[i]) };
      });
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
    type: Boolean,
    name: 'marked_read_post',
  })
  @Expose()
  public markedReadPost?: boolean;

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
    type: Boolean,
  })
  @Expose()
  public isArticle: boolean;

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
  linkPreview?: LinkPreviewDto;

  public constructor(data: Partial<PostResponseDto>) {
    Object.assign(this, data);
  }
}
