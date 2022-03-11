import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { PostContentDto } from '../post-content.dto';
import { SettingDto } from '../setting.dto';

export class PostDto {
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
    type: SettingDto,
  })
  @Expose()
  public setting: SettingDto;

  @ApiProperty({
    description: 'To know draft post or not',
    type: Boolean,
  })
  @Expose()
  public isDraft: boolean;
}
