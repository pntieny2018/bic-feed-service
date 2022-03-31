import { Expose } from 'class-transformer';

export class GetUserIdsResponseData {
  @Expose()
  public userIds: number[];
}
export class GetUserIdsResponseDto {
  @Expose()
  public limit: number;

  @Expose()
  public followedAt: string;

  @Expose()
  public data: GetUserIdsResponseData;

  public constructor(limit: number, followedAt: string, data: GetUserIdsResponseData) {
    this.limit = limit;
    this.followedAt = followedAt;
    this.data = data;
  }
}
