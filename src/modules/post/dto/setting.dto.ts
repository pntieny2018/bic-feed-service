import { ApiProperty } from '@nestjs/swagger';

export class SettingDto {
  @ApiProperty({ type: Boolean, description: 'Allow to react' })
  canReact?: boolean;

  @ApiProperty({ type: Boolean, description: 'Allow to share post' })
  canShare?: boolean;

  @ApiProperty({ type: Boolean, description: 'Allow to comment' })
  canComment?: boolean;

  @ApiProperty({ type: Boolean, description: 'Set important post' })
  isImportant?: boolean;

  @ApiProperty({ type: Date, description: 'Set important expire time' })
  importantExpiredAt?: string;
}
