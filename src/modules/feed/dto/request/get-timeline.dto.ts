import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsNotEmpty, IsInt, IsUUID } from 'class-validator';
import { PageOptionsDto } from '../../../../common/dto';

export class GetTimelineDto extends PageOptionsDto {
  @ApiProperty({ name: 'group_id', example: 'c8ddd4d4-9a5e-4d93-940b-e332a8d0422d' })
  @IsUUID()
  @IsNotEmpty()
  @Expose({
    name: 'group_id',
  })
  public groupId: string;
}
