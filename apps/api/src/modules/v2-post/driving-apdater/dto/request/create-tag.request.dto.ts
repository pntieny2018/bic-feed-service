import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MaxLength } from 'class-validator';
import { Expose, Type } from 'class-transformer';

export class CreateTagRequestDto {
  @ApiProperty({ type: String })
  @Type(() => String)
  @MaxLength(32)
  public name: string;

  @ApiProperty({ type: String })
  @Type(() => String)
  @IsNotEmpty()
  @Expose({
    name: 'group_id',
  })
  public groupId: string;

  public constructor(data: CreateTagRequestDto) {
    Object.assign(this, data);
  }
}
