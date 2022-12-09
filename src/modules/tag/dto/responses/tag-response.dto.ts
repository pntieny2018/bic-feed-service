import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { Expose } from 'class-transformer';

export class TagResponseDto {
  @ApiProperty()
  @IsUUID()
  @Expose()
  public id: string;

  @ApiProperty({
    name: 'group_id',
  })
  @Expose()
  public groupId: string;

  @ApiProperty()
  @Expose()
  public name: string;

  @ApiProperty()
  @Expose()
  public slug: string;

  @ApiProperty({
    name: 'created_by',
  })
  public createdBy: string;

  @ApiProperty({
    name: 'updated_by',
  })
  public updatedBy: string;

  @ApiProperty({
    name: 'created_at',
  })
  public createdAt?: Date;

  @ApiProperty({
    name: 'updated_at',
  })
  public updateAt?: Date;

  public constructor(data: Partial<TagResponseDto>) {
    Object.assign(this, data);
  }
}
