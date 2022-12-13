import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ReportTo, TargetType } from '../contstants';
import { IsArray, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateReportDto {
  @ApiProperty()
  @Expose({
    name: 'target_id',
  })
  @IsNotEmpty()
  public targetId: string;

  @ApiProperty()
  @ApiProperty({
    type: [String],
    example: ['9322c384-fd8e-4a13-80cd-1cbd1ef95ba8', '986dcaf4-c1ea-4218-b6b4-e4fd95a3c28e'],
  })
  @IsNotEmpty()
  @IsUUID('4', { each: true })
  @IsArray()
  @Expose({
    name: 'group_ids',
  })
  public groupIds: string[];

  @ApiProperty({
    enum: [TargetType],
  })
  @Expose({
    name: 'target_type',
  })
  @IsNotEmpty()
  public targetType: TargetType;

  @ApiProperty({
    enum: [ReportTo],
  })
  @Expose({
    name: 'report_to',
  })
  @IsNotEmpty()
  public reportTo: ReportTo;

  @ApiProperty()
  @Expose({
    name: 'reason_type',
  })
  @IsNotEmpty()
  public reasonType: string;

  @ApiProperty()
  @IsOptional()
  public reason?: string;

  @ApiProperty()
  @IsOptional()
  public attachment?: string;
}
