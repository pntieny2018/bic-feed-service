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

  @ApiProperty({
    name: 'created_at',
  })
  @Expose()
  public createdAt?: Date;

  public constructor(iHashtag: IHashtag) {
    this.id = iHashtag.id;
    this.name = iHashtag.name;
    this.createdAt = iHashtag.createdAt;
  }
}
