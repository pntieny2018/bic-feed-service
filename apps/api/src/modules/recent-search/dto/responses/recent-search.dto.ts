import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class RecentSearchDto {
  @ApiProperty({
    description: 'Recent search ID',
    type: String,
    default: '1',
  })
  @Expose()
  public id: string;

  @ApiProperty({
    description: 'Keyword search',
    type: String,
    default: 'Bein',
  })
  @Expose()
  public keyword: string;
}
