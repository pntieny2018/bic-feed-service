import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsNotEmpty, IsInt, IsUUID } from 'class-validator';
import { PageOptionsDto } from '../../../../common/dto';

export class GetTimelineDto extends PageOptionsDto {
  @ApiProperty({ name: 'group_id', example: 9 })
  @IsUUID()
  @IsNotEmpty()
  @Expose({
    name: 'group_id',
  })
  public groupId: string;
}
