import {IsNotEmpty, IsOptional} from 'class-validator';
import {ApiProperty} from '@nestjs/swagger';
import {Type} from 'class-transformer';

export class CreateSeriesDto {
  @ApiProperty({type: String})
  @Type(() => String)
  @IsNotEmpty()
  public name: string;

  @ApiProperty({type: Boolean})
  @Type(() => Boolean)
  @IsOptional()
  public active: boolean;
}
