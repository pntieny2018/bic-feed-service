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

  public constructor(iCategory: ICategory) {
    this.id = iCategory.id;
    this.parentId = iCategory.parentId;
    this.active = iCategory.isActive;
    this.name = iCategory.name;
    this.slug = iCategory.slug;
    this.level = iCategory.level;
    this.createdBy = iCategory.createdBy;
    this.createdAt = iCategory.createdAt;
    this.updatedAt = iCategory.updatedAt;
  }
}
