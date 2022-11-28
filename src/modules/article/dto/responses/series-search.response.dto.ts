import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { AudienceResponseDto } from '../../../post/dto/responses';

export class SeriesSearchResponseDto {
  @ApiProperty({
    description: 'Post ID',
    type: String,
  })
  @Expose()
  public id: string;

  @ApiProperty({
    description: 'Title',
    type: String,
  })
  @Expose()
  public title: string;

  @ApiProperty({
    type: AudienceResponseDto,
  })
  @Expose()
  public audience: AudienceResponseDto;

  public constructor(data: Partial<SeriesSearchResponseDto>) {
    Object.assign(this, data);
  }
}
