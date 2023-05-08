import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from '../../../../v2-user/application';
import { GroupDto } from '../../../../v2-group/application';

export class AudienceResponseDto {
  @ApiProperty({
    default: [],
    type: UserDto,
    required: false,
    isArray: true,
    description: 'Array of user',
  })
  public users?: UserDto[] = [];

  @ApiProperty({
    type: GroupDto,
    isArray: true,
    description: 'Array of group',
  })
  public groups: GroupDto[];
}
