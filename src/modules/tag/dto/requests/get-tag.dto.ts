import { PageOptionsDto } from '../../../../common/dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { IsOptional, IsUUID } from 'class-validator';

export class GetTagDto extends PageOptionsDto {
  @ApiProperty({ type: String })
  @Type(() => String)
  @IsOptional()
  public name?: string;

  @ApiProperty({
    type: [String],
    name: 'group_ids',
  })
  @IsUUID(4, { each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string' && !value.includes(',')) {
      return [value];
    }
    return value.split(',');
  })
  @Expose({
    name: 'group_ids',
  })
  public groupIds: string[];
}
