import { ApiProperty } from '@nestjs/swagger';
import { ReportTo, TargetType } from '../contstants';

export class CreateReportDto {
  @ApiProperty()
  public targetId: string;

  @ApiProperty({
    enum: [TargetType],
  })
  public targetType: TargetType;

  @ApiProperty({
    enum: [ReportTo],
  })
  public reportTo: ReportTo;

  @ApiProperty()
  public reasonType: string;

  @ApiProperty()
  public reason?: string;

  @ApiProperty()
  public attachment?: string;
}
