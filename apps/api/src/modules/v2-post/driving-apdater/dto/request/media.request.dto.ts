import { IsArray, IsNotEmpty, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

class MediaDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  public id: string;
}

export class MediaRequestDto {
  @ApiProperty({ required: false, type: [MediaDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Transform(({ value }) => value.map((item) => item?.id) ?? [])
  @Type(() => MediaDto)
  public images?: string[];

  @ApiProperty({ required: false, type: [MediaDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @IsOptional()
  @Transform(({ value }) => value.map((item) => item?.id) ?? [])
  @Type(() => MediaDto)
  public videos?: string[];

  @ApiProperty({ required: false, type: [MediaDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Transform(({ value }) => value.map((item) => item?.id) ?? [])
  @Type(() => MediaDto)
  public files?: string[];
}
