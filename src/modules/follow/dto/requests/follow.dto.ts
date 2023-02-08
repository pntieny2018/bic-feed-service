export class FollowDto {
  public userId: string;
  public groupIds: string[];
  public verb: 'FOLLOW' | 'UNFOLLOW';
}
