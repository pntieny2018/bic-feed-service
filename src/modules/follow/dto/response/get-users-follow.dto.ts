export class GetUsersFollowDto {
  public limit: number;
  public page: number;
  public userIds: string[];

  public constructor(limit: number, page: number, userIds: string[]) {
    this.limit = limit;
    this.page = page;
    this.userIds = userIds;
  }
}
