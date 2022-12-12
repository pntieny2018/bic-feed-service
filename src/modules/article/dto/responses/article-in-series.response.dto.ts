import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { IsUUID } from 'class-validator';
import { CategoryResponseDto } from '.';
import { UserSharedDto } from '../../../../shared/user/dto';
import { MediaResponseDto } from '../../../media/dto/response';
import { ReactionResponseDto } from '../../../reaction/dto/response';
import { AudienceResponseDto } from '../../../post/dto/responses';
import { PostSettingDto } from '../../../post/dto/common/post-setting.dto';
import { PostSettingResponseDto } from '../../../post/dto/responses/post-setting-response.dto';

export class ArticleInSeriesResponseDto {
  @ApiProperty({
    description: 'Post ID',
    type: String,
  })
  @IsUUID()
  @Expose()
  public id: string;

  @ApiProperty({
    description: 'Title',
    type: String,
  })
  @Expose()
  public title: string;

  @ApiProperty({
    description: 'zindex',
    type: Number,
  })
  @Expose()
  public zindex: number;

  @ApiProperty({
    description: 'Summary',
    type: String,
  })
  @Expose()
  public summary: string;

  @Expose()
  public lang?: string;

  @ApiProperty({
    type: AudienceResponseDto,
  })
  @Expose()
  public audience: AudienceResponseDto;

  @ApiProperty({
    description: 'Categories',
    type: [CategoryResponseDto],
  })
  @Expose()
  public categories: CategoryResponseDto[];

  @ApiProperty({
    type: MediaResponseDto,
    name: 'cover_media',
  })
  @Expose()
  public coverMedia?: MediaResponseDto;

  @ApiProperty({
    description: 'Post creator information',
    type: UserSharedDto,
  })
  @Expose()
  @Type(() => UserSharedDto)
  public actor: UserSharedDto;

  @ApiProperty({
    type: [ReactionResponseDto],
    name: 'owner_reactions',
  })
  @Expose()
  public ownerReactions?: ReactionResponseDto[] = [];

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

  public constructor(data: Partial<ArticleInSeriesResponseDto>) {
    Object.assign(this, data);
  }
}
