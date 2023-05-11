import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { GiphyType } from '../../../../database/models/giphy.model';

export class GiphyDto {
  @ApiProperty({ type: String })
  @Type(() => String)
  @IsNotEmpty()
  public id: string;

  @ApiProperty({ enum: GiphyType, default: GiphyType.GIF, required: true })
  @IsEnum(GiphyType)
  @IsNotEmpty()
  public type?: GiphyType = GiphyType.GIF;
}
