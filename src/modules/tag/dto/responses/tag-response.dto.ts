import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { Expose } from 'class-transformer';
import { GroupSharedDto } from '../../../../shared/group/dto';

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
    name: 'total_used',
  })
  @Expose()
  public totalUsed: number;

  @ApiProperty({
    name: 'created_at',
  })
  public createdAt?: Date;

  @ApiProperty({
    name: 'updated_at',
  })
  public updateAt?: Date;

  @ApiProperty()
  @Expose()
  public groups?: GroupSharedDto[];

  public constructor(data: Partial<TagResponseDto>) {
    Object.assign(this, data);
  }
}
