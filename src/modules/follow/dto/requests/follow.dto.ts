export class FollowDto {
  public userIds: string[];
  public groupIds: string[];
  public verb: 'FOLLOW' | 'UNFOLLOW';
}
