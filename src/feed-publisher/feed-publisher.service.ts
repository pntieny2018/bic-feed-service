import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class FeedPublisherService {
  private _logger = new Logger(FeedPublisherService.name);

  public deletePostsFromAnyNewsFeed(postIds: number[]): void {
    this._logger.debug(`delete posts from any newsfeed: ${postIds}`);
  }
}
