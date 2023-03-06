import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { GroupSharedDto } from '../../../../shared/group/dto';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { UserDto } from '../../../v2-user/application';

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
  @Type(() => UserDto)
  @ValidateNested({ each: true })
  public users?: UserDto[] = [];

  @ApiProperty({
    type: GroupSharedDto,
    isArray: true,
    description: 'Array of group',
  })
  @ValidateNested({ each: true })
  @IsNotEmpty()
  @ArrayNotEmpty()
  @Type(() => GroupSharedDto)
  public groups: GroupSharedDto[];
}
