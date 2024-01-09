import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';
import { validate as isValidUUID } from 'uuid';

export class GetTotalPostsInGroupDto {
  @ApiProperty({
    type: String,
    name: 'group_ids',
    example: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8,986dcaf4-c1ea-4218-b6b4-e4fd95a3c28e',
  })
  @IsNotEmpty()
  @Expose({
    name: 'group_ids',
  })
  @Transform((data) => {
    let value;
    if (!data.obj.group_ids && data.obj.groupIds) {
      value = data.obj.groupIds;
    } else {
      value = data.obj.group_ids;
    }

    return value.split(',').filter((v) => isValidUUID(v));
  })
  public groupIds?: string[];
}
