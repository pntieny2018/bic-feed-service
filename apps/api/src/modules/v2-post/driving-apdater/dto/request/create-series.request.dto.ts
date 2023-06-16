import { IsNotEmpty, IsOptional, MaxLength, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { AudienceRequestDto } from './audience.request.dto';
import { MediaDto } from './media.request.dto';
import { PostSettingRequestDto } from './post-setting.request.dto';

export class CreateSeriesRequestDto {
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
    type: MediaDto,
    example: {
      id: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8',
    },
  })
  @IsNotEmpty()
  @Expose({
    name: 'cover_media',
  })
  public coverMedia: MediaDto;

  @ApiProperty({
    description: 'Setting post',
    type: PostSettingRequestDto,
    required: false,
    example: {
      canReact: true,
      canComment: true,
      isImportant: false,
      importantExpiredAt: null,
    },
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PostSettingRequestDto)
  public setting?: PostSettingRequestDto;
}
