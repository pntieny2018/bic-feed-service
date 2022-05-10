import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
export enum GroupPrivacy {
  PUBLIC = 'PUBLIC',
  OPEN = 'OPEN',
  PRIVATE = 'PRIVATE',
  SECRET = 'SECRET',
}
export class ChildGroup {
  public public: number[] = [];
  public open: number[] = [];
  public private: number[] = [];
  public secret: number[] = [];
}
export class GroupSharedDto {
  @ApiProperty({
    description: 'Group ID',
  })
  @IsNotEmpty()
  @IsNumber()
  public id: number;

  @ApiProperty({
    description: 'Group Name',
  })
  @IsOptional()
  public name: string;

  @ApiProperty({
    description: 'Group Icon',
  })
  @IsOptional()
  public icon: string;

  public privacy: GroupPrivacy;

  public child?: ChildGroup = {
    public: [],
    open: [],
    private: [],
    secret: [],
  };
}
