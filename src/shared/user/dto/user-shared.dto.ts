import { ApiProperty } from '@nestjs/swagger';

export class UserDataShareDto {
  @ApiProperty({
    description: 'User ID',
    type: String,
  })
  public id: string;

  @ApiProperty({
    description: 'Username',
    type: String,
  })
  public username?: string;

  @ApiProperty({
    description: 'Fullname',
    type: String,
  })
  public fullname?: string;

  @ApiProperty({
    description: 'Avatar',
    type: String,
  })
  public avatar?: string;

  @ApiProperty({
    description: 'Email',
    type: String,
  })
  public email?: string;

  public constructor(data: Partial<UserDataShareDto>) {
    Object.assign(this, data);
  }
}

export class UserSharedDto extends UserDataShareDto {
  public groups?: string[];
}
