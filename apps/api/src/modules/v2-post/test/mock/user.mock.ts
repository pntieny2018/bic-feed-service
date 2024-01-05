import { UserDto } from '@libs/service/user';
import { v4 } from 'uuid';

export function createMockUserDto(data: Partial<UserDto> = {}): UserDto {
  return {
    id: v4(),
    fullname: 'Admin EVOL',
    username: 'admin',
    avatar:
      'https://bic-dev-entity-attribute-s3-bucket.s3.ap-southeast-1.amazonaws.com/static/user/default-avatar.png',
    groups: [v4()],
    ...data,
  };
}
