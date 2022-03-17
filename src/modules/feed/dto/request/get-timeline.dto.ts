import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsNotEmpty, IsInt, IsOptional, IsString } from 'class-validator';
import { PagingDto } from 'src/common/dto';
import { FeedRanking } from '../../feed.enum';
import { CanReadTimeline } from '../../validations/decorators';

export class GetTimelineDto extends PagingDto {
  @ApiProperty({ name: 'group_id', example: 9 })
  @CanReadTimeline()
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  @Expose({ name: 'group_id' })
  public groupId: number;

  @ApiProperty({
    enum: FeedRanking,
    required: false,
    default: FeedRanking.IMPORTANT,
  })
  @IsString()
  @IsOptional()
  @Expose({ name: 'ranking' })
  public ranking?: FeedRanking = FeedRanking.IMPORTANT;
}
