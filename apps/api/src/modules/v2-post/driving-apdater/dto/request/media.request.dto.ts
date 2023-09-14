import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsUUID, ValidateNested } from 'class-validator';

// TODO: Remove this class and use MediaItemDto instead from apps/api/src/modules/v2-post/application/dto/media.dto.ts
export class MediaDto {
  @ApiProperty()
  @Type(() => String)
  @IsUUID()
  @IsNotEmpty()
  @Expose()
  public id: string;
}

// TODO: Remove this class and use MediaDto instead from apps/api/src/modules/v2-post/application/dto/media.dto.ts
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
