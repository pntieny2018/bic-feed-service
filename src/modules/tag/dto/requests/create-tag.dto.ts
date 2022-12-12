import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { Expose, Type } from 'class-transformer';

export class CreateTagDto {
  @ApiProperty({ type: String })
  @Type(() => String)
  @IsNotEmpty()
  @Expose()
  public name: string;

  @ApiProperty({ type: String })
  @Type(() => String)
  @IsNotEmpty()
  @Expose({
    name: 'group_id',
  })
  public groupId: string;
}
