import { Expose, Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { isArray, IsBoolean, IsNotEmpty, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { PostContentDto } from '../common/post-content.dto';
import { Audience } from '../common/audience.dto';
import { PostSettingDto } from '../common/post-setting.dto';
import { UserDto } from 'src/modules/auth';

export class CreatePostDto {
  @ApiProperty({
    description: 'Audience',
    type: Audience,
  })
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => Audience)
  public audience: Audience;

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
  public setting?: PostSettingDto;

  @ApiProperty({
    description: 'Setting post',
    type: PostSettingDto,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UserDto)
  @IsArray()
  public mentions?: UserDto[];

  @ApiProperty({
    description: 'To know draft post or not',
    type: Boolean,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  public isDraft = true;
}
