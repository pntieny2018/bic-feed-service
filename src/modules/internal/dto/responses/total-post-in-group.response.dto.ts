import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class TotalPostInGroupsDto {
  @ApiProperty({
    type: String,
    description: 'Group ID',
  })
  @Expose()
  public groupId: string;

  @ApiProperty({
    type: Number,
    description: 'Total Posts',
  })
  @Expose()
  public totalPost: number;

  @ApiProperty({
    type: Number,
    description: 'Total Articles',
  })
  @Expose()
  public totalArticle: number;

  @ApiProperty({
    type: Number,
    description: 'Total Series',
  })
  @Expose()
  public totalSeries: number;
}
