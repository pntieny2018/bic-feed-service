import { PageOptionsDto } from '../../../../common/dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsOptional } from 'class-validator';

export class GetTagDto extends PageOptionsDto {
  @ApiProperty({ type: String })
  @Type(() => String)
  @IsOptional()
  public name?: string;

  @ApiProperty({ type: String })
  @Type(() => String)
  @Expose({
    name: 'group_id',
  })
  public groupId: string;
}
