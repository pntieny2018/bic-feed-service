import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';
import { PageOptionsDto } from '../../../../common/dto';

export class GetCommentEditedHistoryDto extends PageOptionsDto {
  @ApiProperty({
    description: 'Upper bound editedAt timestamp.',
    required: false,
    type: String,
    default: '2022-04-17T02:35:30.947+07',
  })
  @IsDateString()
  @IsOptional()
  public endTime?: string;
}
