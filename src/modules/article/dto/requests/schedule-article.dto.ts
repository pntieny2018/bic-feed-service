import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';
import { ExceptionHelper } from '../../../../common/helpers';
import { HTTP_STATUS_ID } from '../../../../common/constants';

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
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_ARTICLE_INVALID_PUBLISHED_AT);
    }
    return date;
  })
  public publishedAt?: Date;
}
