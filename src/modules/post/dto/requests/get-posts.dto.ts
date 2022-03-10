import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class GetPostDto {
  @ApiProperty({
    description: 'Sort recent search by created time',
    enum: ['asc', 'desc'],
    default: 'desc',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Transform((params) => params.value ?? 'desc')
  public sort?: 'asc' | 'desc' = 'desc';

  @ApiProperty({
    description: 'Limit recent search',
    default: 10,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Transform((params) => parseInt(params.value) ?? 10)
  public limit?: number;
}
