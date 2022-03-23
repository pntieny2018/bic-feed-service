import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsNotEmpty, IsInt, IsOptional, IsString } from 'class-validator';
import { PageOptionsDto } from '../../../../common/dto';
import { FeedRanking } from '../../feed.enum';

export class GetTimelineDto extends PageOptionsDto {
  @ApiProperty({ name: 'groupId', example: 9 })
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
