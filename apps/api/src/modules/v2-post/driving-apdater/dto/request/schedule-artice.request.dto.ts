import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';
import { PublishArticleRequestDto } from './publish-artice.request.dto';

export class ScheduleArticleRequestDto extends PublishArticleRequestDto {
  @ApiProperty({
    required: true,
    example: '2021-11-03T16:59:00.000Z',
    type: Date,
  })
  @Expose({
    name: 'scheduled_at',
  })
  @IsNotEmpty()
  @IsDateString()
  public scheduledAt: Date;

  public constructor(data: ScheduleArticleRequestDto) {
    super(data);
    Object.assign(this, data);
  }
}
