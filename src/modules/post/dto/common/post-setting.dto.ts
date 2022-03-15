import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class PostSettingDto {
  @ApiProperty({ type: Boolean, default: true, description: 'Allow to react' })
  @IsOptional()
  @IsBoolean()
  public canReact?: boolean = true;

  @ApiProperty({ type: Boolean, default: true, description: 'Allow to share post' })
  @IsOptional()
  @IsBoolean()
  public canShare?: boolean = true;

  @ApiProperty({ type: Boolean, default: true, description: 'Allow to comment' })
  @IsOptional()
  @IsBoolean()
  public canComment?: boolean = true;

  @ApiProperty({ type: Boolean, default: false, description: 'Set important post' })
  @IsOptional()
  @IsBoolean()
  public isImportant?: boolean = false;

  @ApiProperty({
    required: false,
    example: '2021-11-03T16:59:00.000Z',
    type: Date,
    description: 'Set important expire time',
  })
  @IsOptional()
  @IsDateString()
  public importantExpiredAt?: Date;
}
