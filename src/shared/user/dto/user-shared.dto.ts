import { ApiProperty } from '@nestjs/swagger';

export class UserSharedDto {
  @ApiProperty({
    type: Number,
  })
  public userId: number;

  @ApiProperty({
    type: String,
    required: false,
  })
  public username: string;

  @ApiProperty({
    type: String,
    required: false,
  })
  public fullname?: string;

  @ApiProperty({
    type: String,
    required: false,
  })
  public avatar?: string;
  public groups: number[];
}
