import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { GroupSharedDto } from '../../../../../shared/group/dto';
import { UserDto } from '../../../../v2-user/application';

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
    type: GroupSharedDto,
    isArray: true,
    description: 'Array of group',
  })
  public groups: GroupSharedDto[];
}
