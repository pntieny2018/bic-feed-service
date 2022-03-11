import { ApiProperty } from '@nestjs/swagger';

export class SettingDto {
  @ApiProperty({ type: Boolean, description: 'Allow to react' })
  public canReact?: boolean;

  @ApiProperty({ type: Boolean, description: 'Allow to share post' })
  public canShare?: boolean;

  @ApiProperty({ type: Boolean, description: 'Allow to comment' })
  public canComment?: boolean;

  @ApiProperty({ type: Boolean, description: 'Set important post' })
  public isImportant?: boolean;

  @ApiProperty({ type: Date, description: 'Set important expire time' })
  public importantExpiredAt?: string;
}
