import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsDateString, ValidateIf, IsNotEmpty } from 'class-validator';

export class PostSettingDto {
  @ApiProperty({ type: Boolean, default: true, required: false, description: 'Allow to react' })
  @IsOptional()
  @IsBoolean()
  public canReact?: boolean;

  @ApiProperty({
    type: Boolean,
    default: true,
    required: false,
    description: 'Allow to share post',
  })
  @IsOptional()
  @IsBoolean()
  public canShare?: boolean;

  @ApiProperty({ type: Boolean, default: true, required: false, description: 'Allow to comment' })
  @IsOptional()
  @IsBoolean()
  public canComment?: boolean;

  @ApiProperty({
    type: Boolean,
    example: true,
    default: false,
    required: false,
    description: 'Set important post',
  })
  @IsOptional()
  @IsBoolean()
  public isImportant?: boolean;

  @ApiProperty({
    required: false,
    example: '2021-11-03T16:59:00.000Z',
    type: Date,
    description: 'Set important expire time',
    default: null,
  })
  @ValidateIf((i) => i.isImportant === true)
  @IsNotEmpty()
  @IsDateString()
  public importantExpiredAt?: Date;
}
