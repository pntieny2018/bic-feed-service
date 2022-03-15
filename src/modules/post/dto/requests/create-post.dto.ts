import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional } from 'class-validator';
import { PostContentDto } from '../post-content.dto';
import { Audience } from '../audience.dto';
import { SettingDto } from '../setting.dto';

export class CreatePostDto {
  @ApiProperty({
    description: 'Audience',
    type: Audience,
  })
  public audience?: Audience;

  @ApiProperty({
    description: 'Post data, includes content, images, files, videos',
    type: PostContentDto,
  })
  public data?: PostContentDto;

  @ApiProperty({
    description: 'Setting post',
    type: SettingDto,
  })
  @IsNotEmpty()
  public setting?: SettingDto;

  @ApiProperty({
    description: 'To know draft post or not',
    name: 'is_draft',
    type: Boolean,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  public isDraft?: boolean = false;
}
