import { UserDto } from '../../auth';
import { TargetType } from '../contstants';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class StatisticsReportResponseDto {
  @ApiProperty({
    name: 'target_type',
    enum: [TargetType],
  })
  public targetType: TargetType;

  @ApiProperty({
    name: 'reason_type',
  })
  public reasonType: string;

  @ApiProperty({
    required: false,
  })
  public reason?: string;

  @ApiProperty()
  public total: number;

  @ApiProperty()
  @Type(() => UserDto)
  public reporters: UserDto[];

  public constructor(data: Partial<StatisticsReportResponseDto>) {
    Object.assign(this, data);
  }
}

export class StatisticsReportResponsesDto {
  @ApiProperty()
  @Type(() => StatisticsReportResponseDto)
  public reports: StatisticsReportResponseDto[];

  @ApiProperty()
  public total: number;

  public constructor(reports: StatisticsReportResponseDto[], total: number) {
    this.reports = reports;
    this.total = total;
  }
}
