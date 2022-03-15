import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray } from 'class-validator';
import { UserDto } from 'src/modules/auth';
import { PostContentDto } from '../common/post-content.dto';
import { PostSettingDto } from '../common/post-setting.dto';
import { ReactionCountDto } from '../common/reaction-count.dto';

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
    type: UserDto,
  })
  @Expose()
  @Type(() => UserDto)
  public actor: UserDto;

  @ApiProperty({
    description: 'Array of user',
    type: UserDto,
  })
  @Expose()
  public mentions: UserDto[];

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
  @Type(() => ReactionCountDto)
  @IsArray()
  public reactionCount: ReactionCountDto[] = [];
}
