import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { PageOptionsDto } from '../../../../common/dto';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsUUID, ValidateIf } from 'class-validator';
import { PostType } from '../../../../database/models/post.model';

export class GetTimelineDto extends PageOptionsDto {
  @ApiProperty({ name: 'group_id', example: 'c8ddd4d4-9a5e-4d93-940b-e332a8d0422d' })
  @IsUUID()
  @IsNotEmpty()
  @Expose({
    name: 'group_id',
  })
  public groupId: string;

  @ApiProperty({ name: 'is_important', example: true })
  @IsOptional()
  @Expose({
    name: 'is_important',
  })
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return null;
  })
  public isImportant?: boolean;

  @ApiProperty({ name: 'is_mine', example: false })
  @IsOptional()
  @Expose({
    name: 'is_mine',
  })
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return null;
  })
  public isMine?: boolean;

  @ApiProperty({ name: 'is_saved', example: true })
  @IsOptional()
  @Expose({
    name: 'is_saved',
  })
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return null;
  })
  public isSaved?: boolean;

  @ApiProperty({
    description: 'Type',
    required: false,
    default: '',
    enum: PostType,
  })
  @Expose()
  @IsOptional()
  @IsEnum(PostType)
  @ValidateIf((i) => i.type !== '')
  public type?: PostType;
}
