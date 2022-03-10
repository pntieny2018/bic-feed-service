import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { PostContentDto } from '../post-content.dto';
import { SettingDto } from '../setting.dto';

export class PostDto {
  @ApiProperty({
    description: 'Post ID',
    type: Number,
    default: 1,
  })
  @Expose({ name: 'is_draft' })
  id: number;

  @ApiProperty({
    description: 'Keyword search',
    type: String,
    default: 'Bein',
  })
  @Expose({ name: 'is_draft' })
  data: PostContentDto;

  @ApiProperty({
    description: 'Setting post',
    type: SettingDto,
  })
  setting?: SettingDto;

  @ApiProperty({
    description: 'To know draft post or not',
    name: 'is_draft',
    type: Boolean,
    default: true,
  })
  @Expose({ name: 'is_draft' })
  isDraft = false;
}
