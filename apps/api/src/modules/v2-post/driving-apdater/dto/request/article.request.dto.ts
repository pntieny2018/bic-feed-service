import { CONTENT_STATUS } from '@beincom/constants';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PageOptionsDto } from 'apps/api/src/common/dto';
import { Expose, Transform } from 'class-transformer';
import { IsArray, IsDateString, IsInt, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

import { PostStatusConflictedException } from '../../../domain/exception';

import { MediaDto } from './media.request.dto';
import { PublishPostRequestDto } from './post.request.dto';

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

export class PublishArticleRequestDto extends UpdateArticleRequestDto {}

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

export class GetScheduleArticleDto extends PageOptionsDto {
  @ApiProperty({
    enum: [CONTENT_STATUS],
  })
  @IsNotEmpty()
  @Transform(({ value }) => {
    const status = value.split(',').filter((v) => Object.values(CONTENT_STATUS).includes(v));
    const scheduleTypeStatus = [CONTENT_STATUS.WAITING_SCHEDULE, CONTENT_STATUS.SCHEDULE_FAILED];

    const isConflictStatus = (status: CONTENT_STATUS[]): boolean => {
      // check status must in scheduleTypeStatus
      return status.some((s) => !scheduleTypeStatus.includes(s));
    };
    if (isConflictStatus(status)) {
      throw new PostStatusConflictedException();
    }
    return status;
  })
  public status: CONTENT_STATUS[];
}
