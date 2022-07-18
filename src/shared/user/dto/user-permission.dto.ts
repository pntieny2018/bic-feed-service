import { ApiProperty } from '@nestjs/swagger';

export class UserPermissionDto {
  @ApiProperty({
    type: Object,
    name: 'communities',
  })
  communities: { [commId: string]: string[] };

  @ApiProperty({
    type: Object,
    name: 'groups',
  })
  groups: { [groupId: string]: string[] };
}
