import { Expose, Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { PostContentDto } from '../common/post-content.dto';
import { Audience } from '../common/audience.dto';
import { SettingDto } from '../common/post-setting.dto';

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
    type: SettingDto,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SettingDto)
  public setting?: SettingDto;

  @ApiProperty({
    description: 'To know draft post or not',
    type: Boolean,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  public isDraft = true;
}
