import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PageOptionsDto } from '../../../common/dto';
import { IsOptional } from 'class-validator';

export enum GetReportType {
  POST = 'POST',
  ARTICLE = 'ARTICLE',
  COMMENT = 'COMMENT',
  ALL = 'ALL',
}

export class GetReportDto extends PageOptionsDto {
  @ApiProperty({
    name: 'target_type',
    enum: GetReportType,
  })
  @IsOptional()
  @Expose({
    name: 'target_type',
  })
  public targetType?: GetReportType;

  @ApiProperty({
    name: 'group_id',
  })
  @IsOptional()
  @Expose({
    name: 'group_id',
  })
  public groupId: string;
}
