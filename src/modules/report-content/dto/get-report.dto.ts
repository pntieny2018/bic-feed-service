import { Expose } from 'class-transformer';
import { ReportStatus, TargetType } from '../contstants';
import { ApiProperty } from '@nestjs/swagger';
import { PageOptionsDto } from '../../../common/dto';
import { IsOptional, IsUUID } from 'class-validator';

export class GetReportDto extends PageOptionsDto {
  @ApiProperty({
    name: 'reporter_id',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  @Expose({
    name: 'reporter_id',
  })
  public createdBy?: string;

  @ApiProperty({
    name: 'updated_by',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  @Expose({
    name: 'updated_by',
  })
  public updatedBy?: string;

  @ApiProperty({
    name: 'target_type',
    enum: [TargetType],
    required: false,
  })
  @IsOptional()
  @Expose({
    name: 'target_type',
  })
  public targetType?: TargetType;

  @ApiProperty({
    name: 'group_id',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  @Expose({
    name: 'group_id',
  })
  public groupId?: string;

  @ApiProperty({
    name: 'updated_by',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  @Expose({
    name: 'updated_by',
  })
  public reportTo: string;

  @ApiProperty({
    name: 'updated_by',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  @Expose({
    name: 'updated_by',
  })
  public reasonType: string;

  @ApiProperty({
    name: 'reason',
    required: false,
  })
  @IsOptional()
  @Expose({
    name: 'reason',
  })
  public reason?: string;

  @ApiProperty({
    enum: [ReportStatus],
  })
  @IsOptional()
  public status?: ReportStatus;

  @ApiProperty({
    name: 'community_id',
  })
  @IsUUID()
  @IsOptional()
  @Expose({
    name: 'community_id',
  })
  public communityId?: string;

  @ApiProperty({
    name: 'target_id',
  })
  @IsUUID()
  @IsOptional()
  @Expose({
    name: 'target_id',
  })
  public targetId?: string;

  @ApiProperty({
    name: 'author_id',
  })
  @IsUUID()
  @IsOptional()
  @Expose({
    name: 'author_id',
  })
  public authorId?: string;
}
