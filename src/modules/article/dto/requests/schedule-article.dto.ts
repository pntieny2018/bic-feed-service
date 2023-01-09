import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';

export class ScheduleArticleDto {
  @ApiProperty({
    type: String,
    required: true,
  })
  @Expose({
    name: 'published_at',
  })
  @IsNotEmpty()
  public publishedAt?: Date;
}
