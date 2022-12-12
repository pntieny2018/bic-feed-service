import { ApiProperty } from '@nestjs/swagger';
import { TargetType } from '../contstants';

export class CreateReportDto {
  @ApiProperty()
  public targetId: string;

  @ApiProperty({
    enum: [TargetType],
  })
  public targetType: TargetType;

  @ApiProperty()
  public reasonType: string;

  @ApiProperty()
  public reason?: string;

  @ApiProperty()
  public attachment?: string;
}
