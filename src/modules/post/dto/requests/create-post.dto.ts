import { UserSharedDto } from './../../../../shared/user/dto/user-shared.dto';
import { AudienceDto } from './../common/audience.dto';
import { Expose, Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  isArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { PostContentDto } from '../common/post-content.dto';
import { PostSettingDto } from '../common/post-setting.dto';

export class CreatePostDto {
  @ApiProperty({
    description: 'Audience',
    type: AudienceDto,
  })
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AudienceDto)
  public audience: AudienceDto;

  @ApiProperty({
    description: 'Post data, includes content, images, files, videos',
    type: PostContentDto,
  })
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PostContentDto)
  public data: PostContentDto;

  @ApiProperty({
    description: 'Setting post',
    type: PostSettingDto,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PostSettingDto)
  public setting?: PostSettingDto = { isImportant: false };

  @ApiProperty({
    description: 'Setting post',
    type: PostSettingDto,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UserSharedDto)
  @IsArray()
  public mentions?: UserSharedDto[] = [];

  @ApiProperty({
    description: 'To know draft post or not',
    type: Boolean,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  public isDraft = true;
}
