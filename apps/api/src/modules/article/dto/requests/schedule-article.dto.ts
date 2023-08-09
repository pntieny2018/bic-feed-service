import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';
import { ArticlePublishInvalidTimeException } from '../../../v2-post/domain/exception';

export class ScheduleArticleDto {
  @ApiProperty({
    type: String,
    required: true,
  })
  @Expose({
    name: 'published_at',
  })
  @IsNotEmpty()
  @Transform(({ value }) => {
    const date = new Date(value);
    if (!date.getTime() || date.getTime() <= Date.now()) {
      throw new ArticlePublishInvalidTimeException();
    }
    return date;
  })
  public publishedAt?: Date;
}
