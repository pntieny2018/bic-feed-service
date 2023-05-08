import { Injectable } from '@nestjs/common';
import { PostService } from '../post/post.service';

@Injectable()
export class InternalService {
  public constructor(private _postService: PostService) {}

  public async getTotalPostByGroupIds(groupIds: string[]): Promise<any> {
    return this._postService.getTotalPostByGroupIds(groupIds);
  }
}
