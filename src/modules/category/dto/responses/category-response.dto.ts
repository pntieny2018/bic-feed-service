import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { Expose } from 'class-transformer';
import { ICategory } from '../../../../database/models/category.model';

export class CategoryResponseDto {
  @ApiProperty()
  @IsUUID()
  @Expose()
  public id: string;

  @ApiProperty({
    name: 'parent_id',
  })
  @IsUUID()
  @Expose()
  public parentId: string;

  @ApiProperty()
  @Expose()
  public active: boolean;

  @ApiProperty()
  @Expose()
  public name: string;

  @ApiProperty()
  @Expose()
  public level: number;

  @ApiProperty()
  @Expose()
  public slug: string;

  @ApiProperty({
    name: 'created_by',
  })
  @Expose()
  public createdBy: string;

  @ApiProperty({
    name: 'created_at',
  })
  @Expose()
  public createdAt?: Date;

  @ApiProperty({
    name: 'updated_at',
  })
  @Expose()
  public updatedAt?: Date;

  public constructor(data: Partial<CategoryResponseDto>) {
    Object.assign(this, data);
  }
}
