import { CONTENT_REPORT_REASON_TYPE } from '@beincom/constants';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum } from 'class-validator';

export class CreateReportDto {
  @ApiProperty({ name: 'reason_type' })
  @IsEnum(CONTENT_REPORT_REASON_TYPE)
  @Expose({ name: 'reason_type' })
  public reasonType: CONTENT_REPORT_REASON_TYPE;

  @ApiPropertyOptional({ name: 'reason' })
  @Expose({ name: 'reason' })
  public reason?: string;
}
