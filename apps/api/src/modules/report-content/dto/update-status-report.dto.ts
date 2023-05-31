import { ReportStatus } from '../contstants';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional } from 'class-validator';
import { Expose } from 'class-transformer';

export class UpdateStatusReportDto {
  @ApiProperty({
    name: 'report_ids',
  })
  @IsArray()
  @IsOptional()
  @Expose({
    name: 'report_ids',
  })
  public reportIds: string[];

  @ApiProperty({
    name: 'target_ids',
  })
  @IsOptional()
  @Expose({
    name: 'target_ids',
  })
  public targetIds: string[];

  @ApiProperty({
    example: Object.values(ReportStatus).join(','),
  })
  public status: ReportStatus;
}
