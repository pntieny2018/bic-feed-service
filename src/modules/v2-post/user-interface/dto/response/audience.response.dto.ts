import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserSharedDto } from '../../../../../shared/user/dto';
import { GroupSharedDto } from '../../../../../shared/group/dto';

export class AudienceResponseDto {
  @ApiProperty({
    default: [],
    type: UserSharedDto,
    required: false,
    isArray: true,
    description: 'Array of user',
  })
  public users?: UserSharedDto[] = [];

  @ApiProperty({
    type: GroupSharedDto,
    isArray: true,
    description: 'Array of group',
  })
  public groups: GroupSharedDto[];
}
