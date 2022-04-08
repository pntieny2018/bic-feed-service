import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class UserDataShareDto {
  @ApiProperty({
    description: 'User ID',
    type: Number,
  })
  @Expose()
  @IsNotEmpty()
  public id: number;

  @ApiProperty({
    description: 'Username',
    type: String,
  })
  @Expose()
  @IsOptional()
  public username?: string;

  @ApiProperty({
    description: 'Fullname',
    type: String,
  })
  @Expose()
  @IsOptional()
  public fullname?: string;

  @ApiProperty({
    description: 'Avatar',
    type: String,
  })
  @Expose()
  @IsOptional()
  public avatar?: string;
}

export class UserSharedDto extends UserDataShareDto {
  public groups?: number[];
}
