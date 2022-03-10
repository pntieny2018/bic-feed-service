export class UserProfile {
  fullname: string;
  avatar: string;
  createdAt?: string;
  updatedAt?: string;
  username?: string;
}
export class UserDto {
  username?: string;
  email?: string;
  userId: number;
  staffRole?: any;
  profile?: UserProfile;

  constructor(userInfo: Partial<UserDto>) {
    Object.assign(this, userInfo);
  }
}
