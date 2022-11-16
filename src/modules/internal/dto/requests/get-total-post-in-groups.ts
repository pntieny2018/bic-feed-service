import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';
import { validate as isValidUUID } from 'uuid';

export class GetTotalPostsInGroupDto {
  @ApiProperty({
    type: String,
    example: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8,986dcaf4-c1ea-4218-b6b4-e4fd95a3c28e',
  })
  @IsNotEmpty()
  @Transform(({ value }) => value.split(',').filter((v) => isValidUUID(v)))
  @Expose({
    name: 'group_ids',
  })
  public groupIds?: string[];
}
