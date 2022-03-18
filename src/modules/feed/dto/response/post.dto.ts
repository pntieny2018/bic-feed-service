import { UserSharedDto } from 'src/shared/user/dto/user-shared.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray } from 'class-validator';
import { PostContentDto } from 'src/modules/post/dto/common/post-content.dto';
import { PostSettingDto } from 'src/modules/post/dto/common/post-setting.dto';
import { ReactionCountDto } from 'src/modules/post/dto/common/reaction-count.dto';

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
    description: 'Array of reaction count',
    type: Boolean,
  })
  @Expose()
  @Expose()
  @IsArray()
  public reactionsCount: Record<string, Record<string, number>>;
}
