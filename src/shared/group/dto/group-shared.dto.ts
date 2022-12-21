import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
export enum GroupPrivacy {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  PRIVATE = 'PRIVATE',
  SECRET = 'SECRET',
}
export class ChildGroup {
  public open: string[] = [];
  public closed: string[] = [];
  public private: string[] = [];
  public secret: string[] = [];
}
export class GroupSharedDto {
  @ApiProperty({
    description: 'Group ID',
  })
  @IsNotEmpty()
  @IsNumber()
  public id: string;

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

  @ApiProperty({
    description: 'Community ID',
  })
  @IsOptional()
  public communityId?: string;

  @ApiProperty()
  @IsOptional()
  public isCommunity?: boolean;

  public privacy: GroupPrivacy;
  public rootGroupId: string;
  public child?: ChildGroup = {
    closed: [],
    open: [],
    private: [],
    secret: [],
  };
}
