import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsUUID } from 'class-validator';

export class CategoryResponseDto {
  @ApiProperty()
  @IsUUID()
  @Expose()
  public id: string;

  @ApiProperty({
    name: 'parent_id',
  })
  @IsUUID()
  public parentId: string;

  @ApiProperty()
  public active: boolean;

  @ApiProperty()
  @Expose()
  public name: string;

  @ApiProperty()
  public level: number;

  @ApiProperty()
  @Expose()
  public slug: string;

  @ApiProperty({
    name: 'created_by',
  })
  public createdBy: string;

  @ApiProperty({
    name: 'created_at',
  })
  @Expose()
  public createdAt?: Date;

  @ApiProperty({
    name: 'updated_at',
  })
  public updatedAt?: Date;
}
