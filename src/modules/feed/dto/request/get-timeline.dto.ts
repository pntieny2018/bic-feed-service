import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsNotEmpty, IsInt } from 'class-validator';
import { PageOptionsDto } from '../../../../common/dto';

export class GetTimelineDto extends PageOptionsDto {
  @ApiProperty({ name: 'group_id', example: 9 })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  @Expose({
    name: 'group_id',
  })
  public groupId: number;
}
