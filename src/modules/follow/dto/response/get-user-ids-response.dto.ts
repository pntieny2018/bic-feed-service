import { Expose } from 'class-transformer';

export class GetUserIdsResponseData {
  @Expose()
  public userIds: string[];
}
export class GetUserIdsResponseDto {
  @Expose()
  public limit: number;

  @Expose({
    name: 'followed_at',
  })
  public followedAt: string;

  @Expose()
  public data: GetUserIdsResponseData;

  public constructor(limit: number, followedAt: string, data: GetUserIdsResponseData) {
    this.limit = limit;
    this.followedAt = followedAt;
    this.data = data;
  }
}
