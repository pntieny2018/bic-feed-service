import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { Expose } from 'class-transformer';
import { IHashtag } from '../../../../database/models/hashtag.model';

export class HashtagResponseDto {
  @ApiProperty()
  @IsUUID()
  @Expose()
  public id: string;

  @ApiProperty()
  @Expose()
  public name: string;

  @ApiProperty()
  @Expose()
  public slug: string;

  @ApiProperty({
    name: 'created_at',
  })
  public createdAt?: Date;

  public constructor(data: Partial<HashtagResponseDto>) {
    Object.assign(this, data);
  }
}
