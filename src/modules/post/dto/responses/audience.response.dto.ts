import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { UserDto } from '../../../v2-user/application';
import { GroupDto } from '../../../v2-group/application';

export class AudienceResponseDto {
  @ApiProperty({
    default: [],
    type: UserDto,
    required: false,
    isArray: true,
    description: 'Array of user',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  public users?: UserDto[] = [];

  @ApiProperty({
    type: GroupDto,
    isArray: true,
    description: 'Array of group',
  })
  @ValidateNested({ each: true })
  @IsNotEmpty()
  @ArrayNotEmpty()
  public groups: GroupDto[];
}
