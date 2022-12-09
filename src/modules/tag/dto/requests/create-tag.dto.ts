import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTagDto {
  @ApiProperty({ type: String })
  @Type(() => String)
  @IsNotEmpty()
  public name: string;

  @ApiProperty({ type: String })
  @Type(() => String)
  @IsNotEmpty()
  public groupId: string;
}
