import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class GetPostEditedHistoryDto {
  @ApiProperty({
    description: 'Maximum number of post-edited.',
    required: false,
    type: Number,
    default: 10,
  })
  @IsOptional()
  public size: number;

  @ApiProperty({
    description: 'Upper bound editedAt timestamp.',
    required: false,
    type: String,
    default: '2022-04-17T02:35:30.947+07',
  })
  @IsOptional()
  @IsDateString()
  public endTime?: string;
}
