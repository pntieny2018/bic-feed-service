import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class RecentSearchDto {
  @ApiProperty({
    description: 'Recent search ID',
    type: Number,
    default: 1,
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'Keyword search',
    type: String,
    default: 'Bein',
  })
  @Expose()
  keyword: string;
}
