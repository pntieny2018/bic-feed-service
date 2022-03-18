import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserDataShareDto {
  @ApiProperty()
  @Expose()
  public id: number;

  @ApiProperty()
  @Expose()
  public username: string;

  @ApiProperty()
  @Expose()
  public fullname: string;

  @ApiProperty()
  @Expose()
  public avatar: string;
}

export class UserSharedDto extends UserDataShareDto {
  public groups: number[];
}
