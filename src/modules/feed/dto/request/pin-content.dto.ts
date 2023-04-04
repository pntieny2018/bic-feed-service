import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';
import { Expose, Transform } from 'class-transformer';

export class PinContentDto {
  @ApiProperty({
    name: 'group_ids',
    type: [String],
    example: ['9322c384-fd8e-4a13-80cd-1cbd1ef95ba8', '986dcaf4-c1ea-4218-b6b4-e4fd95a3c28e'],
  })
  @Expose({
    name: 'group_ids',
  })
  @IsNotEmpty()
  @IsArray()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((v) => v.trim());
    }
    return value;
  })
  @IsUUID('4', { each: true })
  public groupIds: string[];
}
