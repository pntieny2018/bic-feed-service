import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsNotEmpty, IsInt, IsOptional, IsString } from 'class-validator';
import { PageOptionsDto } from 'src/common/dto';
import { FeedRanking } from '../../feed.enum';
import { CanReadTimeline } from '../../validations/decorators';

export class GetTimelineDto extends PageOptionsDto {
  @ApiProperty({ example: 9 })
  @CanReadTimeline()
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  @Expose()
  public groupId: number;

  @ApiProperty({
    enum: FeedRanking,
    required: false,
    default: FeedRanking.IMPORTANT,
  })
  @IsString()
  @IsOptional()
  @Expose()
  public ranking?: FeedRanking = FeedRanking.IMPORTANT;
}
