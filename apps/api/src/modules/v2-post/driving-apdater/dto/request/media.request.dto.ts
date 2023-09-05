import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsUUID, ValidateNested } from 'class-validator';

export class MediaDto {
  @ApiProperty()
  @Type(() => String)
  @IsUUID()
  @IsNotEmpty()
  @Expose()
  public id: string;
}

export class MediaRequestDto {
  @ApiProperty({ required: false, type: [MediaDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaDto)
  @Expose()
  public images?: MediaDto[] = [];

  @ApiProperty({ required: false, type: [MediaDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaDto)
  @IsOptional()
  @Expose()
  public videos?: MediaDto[] = [];

  @ApiProperty({ required: false, type: [MediaDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaDto)
  @Expose()
  public files?: MediaDto[] = [];
}
