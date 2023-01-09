import { IsOptional } from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PageOptionsDto } from '../../../common/dto';
import { TargetType } from '../contstants';

export class GetBlockedContentOfMeDto extends PageOptionsDto {
  @ApiProperty({
    name: 'target_ids',
    required: false,
  })
  @Expose({
    name: 'target_ids',
  })
  @Type(() => Array)
  @Transform(({ value }) => {
    if (typeof value === 'string' && !value.includes(',')) {
      return [value];
    }
    return value;
  })
  public specTargetIds?: string[];

  @ApiProperty({
    example: Object.values(TargetType).join(','),
    name: 'target_type',
    required: false,
  })
  @Expose({
    name: 'target_type',
  })
  @IsOptional()
  public targetType?: TargetType;
}
