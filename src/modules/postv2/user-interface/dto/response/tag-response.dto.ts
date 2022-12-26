import { ApiProperty } from '@nestjs/swagger';
import { GroupSharedDto } from '../../../../../shared/group/dto';

export class TagResponseDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public groupId: string;

  @ApiProperty()
  public name: string;

  @ApiProperty()
  public slug: string;

  @ApiProperty()
  public totalUsed: number;

  @ApiProperty()
  public createdAt?: Date;

  @ApiProperty()
  public updateAt?: Date;

  @ApiProperty()
  public groups?: GroupSharedDto[];

  public constructor(data: Partial<TagResponseDto>) {
    Object.assign(this, data);
  }
}
