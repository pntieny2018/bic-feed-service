export class GetFollowedCondition {
  public condition?: string;

  public bind: {
    followedAt?: Date;
  };

  public constructor(condition: string, bind: { followedAt?: Date }) {
    this.condition = condition;
    this.bind = bind;
  }
}
export class GetUserIdsDto {
  public currentGroupIds: number[];
  public detachedGroupIds: number[];

  public constructor(currentGroupIds: number[], detachedGroupIds: number[]) {
    this.currentGroupIds = currentGroupIds;
    this.detachedGroupIds = detachedGroupIds;
  }
}
