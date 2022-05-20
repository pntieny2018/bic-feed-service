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
    type: PostSettingDto,
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
    name: 'is_draft'
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
    name: 'comments_count'
  })
  @Expose()
  public commentsCount: number;

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
    name: 'reactions_count'
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
    type: Boolean,
  })
  @Expose({
    name: 'marked_read_post'
  })
  public markedReadPost?: boolean;

  @ApiProperty({
    type: Date,
    name: 'created_at'
  })
  @Expose()
  public createdAt: Date;

  @ApiProperty({
    type: Date,
    name: 'updated_at'
  })
  @Expose()
  public updatedAt?: Date;

  @ApiProperty({
    type: Number,
    name: 'created_by'
  })
  @Expose()
  public createdBy: number;

  @ApiProperty({
    type: AudienceResponseDto,
  })
  @Expose()
  public audience: AudienceResponseDto;

  @ApiProperty({
    type: [ReactionResponseDto],
    name: 'owner_reactions'
  })
  @Expose()
  public ownerReactions?: ReactionResponseDto[] = [];

  //@ApiProperty({ type: PageDto<CommentResponseDto>, isArray: true })
  @Expose()
  public comments?: PageDto<CommentResponseDto>;

  public constructor(data: Partial<PostResponseDto>) {
    Object.assign(this, data);
  }
}
