import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { IsUUID } from 'class-validator';
import { Column, CreatedAt, UpdatedAt } from "sequelize-typescript";

export class SeriesResponseDto {
  @ApiProperty()
  @IsUUID()
  @Expose()
  public id: string;

  @ApiProperty({
    type: String,
    name: 'name'
  })
  @Expose()
  public name: string;

  @ApiProperty({
    type: String,
    name: 'slug'
  })
  @Expose()
  public slug: string;

  @ApiProperty({
    type: Boolean,
    name: 'active'
  })
  @Expose()
  public active: boolean;

  @ApiProperty({
    type: Number,
    name: 'created_by'
  })
  @Expose({
    name: 'created_by',
  })
  public createdBy: number;

  @ApiProperty({
    type: Number,
    name: 'updated_by'
  })
  @Expose({
    name: 'updated_by',
  })
  public updatedBy: number;

  @ApiProperty({
    type: Number,
    name: 'total_article'
  })
  @Expose({
    name: 'total_article',
  })
  public totalArticle: number;

  @ApiProperty({
    type: Number,
    name: 'total_view'
  })
  @Expose({
    name: 'total_view',
  })
  public totalView: number;

  @ApiProperty({
    type: Date,
    name: 'created_at'
  })
  @Expose({
    name: 'created_at',
  })
  public createdAt: Date;

  @ApiProperty({
    type: Date,
    name: 'updated_at'
  })
  @Expose({
    name: 'updated_at',
  })
  public updatedAt: Date;


  public constructor(data: Partial<SeriesResponseDto>) {
    Object.assign(this, data);
  }
}
