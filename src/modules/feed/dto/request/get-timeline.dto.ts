import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsNotEmpty, IsInt, IsOptional, IsString } from 'class-validator';
import { PageOptionsDto } from '../../../../common/dto';

export class GetTimelineDto extends PageOptionsDto {
  @ApiProperty({ name: 'groupId', example: 9 })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  @Expose()
  public groupId: number;
}
