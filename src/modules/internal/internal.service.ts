import { Injectable } from '@nestjs/common';
import { PostService } from '../post/post.service';
import { PostStatus } from '../../database/models/post.model';

@Injectable()
export class InternalService {
  public constructor(private _postService: PostService) {}

  public async getTotalPostByGroupIds(groupIds: string[]): Promise<any> {
    return this._postService.getTotalPostByGroupIds(groupIds);
  }

  // TODO move this to kafka
  public async archiveGroup(groupIds: string[]): Promise<boolean> {
    await this._postService.getTotalPostByGroupIds(groupIds);
    return true;
  }
}
