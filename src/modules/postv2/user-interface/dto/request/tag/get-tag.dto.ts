import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { IsOptional, IsUUID, MaxLength } from 'class-validator';
import { PageOptionsDto } from '../../../../../../common/dto';

export class GetTagDto extends PageOptionsDto {
  @ApiProperty({ type: String, required: false })
  @Type(() => String)
  @IsOptional()
  public name?: string;

  @ApiProperty({
    type: [String],
    name: 'group_ids',
  })
  @Type(() => Array)
  @IsUUID(4, { each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string' && !value.includes(',')) {
      return [value];
    }
    return value;
  })
  @Expose({
    name: 'group_ids',
  })
  @IsOptional()
  public groupIds: string[];
}
