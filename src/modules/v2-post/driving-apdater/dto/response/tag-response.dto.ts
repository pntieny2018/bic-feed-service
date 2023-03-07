import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';
import { GroupDto } from '../../../../v2-group/application';

export class TagResponseDto {
  @ApiProperty()
  @Expose()
  public id: string;

  @ApiProperty()
  @Expose()
  public groupId: string;

  @ApiProperty()
  @Expose()
  public name: string;

  @ApiProperty()
  @Expose()
  public slug: string;

  @ApiProperty()
  @Expose()
  public totalUsed: number;

  @ApiProperty()
  @Expose()
  public createdAt?: Date;

  @ApiProperty()
  @Expose()
  public updatedAt?: Date;

  @ApiProperty()
  @Expose()
  public groups?: GroupDto[];

  public constructor(data: Partial<TagResponseDto>) {
    Object.assign(this, data);
  }
}
