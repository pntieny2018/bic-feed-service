import { IsNotEmpty, IsOptional, MaxLength, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { AudienceRequestDto } from '../../../post/dto/requests/audience.request.dto';
import { CoverMediaDto } from '../../../article/dto/requests';
import { PostSettingDto } from '../../../post/dto/common/post-setting.dto';

export class CreateSeriesDto {
  @ApiProperty({
    description: 'Audience',
    type: AudienceRequestDto,
    example: {
      ['user_ids']: [],
      ['group_ids']: [1],
    },
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AudienceRequestDto)
  public audience?: AudienceRequestDto = {
    groupIds: [],
  };

  @ApiProperty({ type: String })
  @Type(() => String)
  @IsNotEmpty()
  @MaxLength(64)
  public title: string;

  @ApiProperty({ type: String })
  @Type(() => String)
  @MaxLength(255)
  @IsOptional()
  public summary: string;

  @ApiProperty({
    type: CoverMediaDto,
    example: {
      id: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8',
    },
  })
  @IsNotEmpty()
  @Expose({
    name: 'cover_media',
  })
  public coverMedia: CoverMediaDto;

  @ApiProperty({
    description: 'Setting post',
    type: PostSettingDto,
    required: false,
    example: {
      ['can_react']: true,
      ['can_comment']: true,
      ['is_important']: false,
      ['important_expired_at']: null,
    },
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PostSettingDto)
  public setting?: PostSettingDto = {
    canReact: true,
    canComment: true,
    isImportant: false,
    importantExpiredAt: null,
  };
}
