import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsUUID } from 'class-validator';
import { MediaDto } from './media.request.dto';
import { PublishPostRequestDto } from './publish-post.request.dto';

export class UpdateArticleRequestDto extends PublishPostRequestDto {
  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @Expose({
    name: 'title',
  })
  public title?: string;

  @ApiPropertyOptional({
    type: String,
  })
  @Expose({
    name: 'summary',
  })
  @IsOptional()
  public summary?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['9322c384-fd8e-4a13-80cd-1cbd1ef95ba8'],
  })
  @IsOptional()
  @IsUUID('4', { each: true })
  @IsArray()
  public categories?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['Beincomm', 'EVOL'],
  })
  @IsOptional()
  @IsUUID('4', { each: true })
  @IsArray()
  public hashtags?: string[];

  @ApiPropertyOptional({
    type: MediaDto,
    example: {
      id: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8',
    },
  })
  @IsOptional()
  @Expose({
    name: 'cover_media',
  })
  public coverMedia?: MediaDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Expose({
    name: 'word_count',
  })
  public wordCount?: number;

  public constructor(data: UpdateArticleRequestDto) {
    super(data);
    Object.assign(this, data);
  }
}
