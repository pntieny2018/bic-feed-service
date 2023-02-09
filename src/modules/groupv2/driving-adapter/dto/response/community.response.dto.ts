import { ApiProperty } from '@nestjs/swagger';

export class CommunityShareDto {
  @ApiProperty({
    type: String,
  })
  public id: string;

  @ApiProperty({
    type: String,
  })
  public name: string;
}
