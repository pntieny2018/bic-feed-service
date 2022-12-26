import { ApiProperty } from '@nestjs/swagger';

export class UserPermissionDto {
  @ApiProperty({
    type: Object,
    name: 'communities',
  })
  public communities: { [commId: string]: string[] };

  @ApiProperty({
    type: Object,
    name: 'groups',
  })
  public groups: { [groupId: string]: string[] };
}
