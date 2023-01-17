import { Injectable } from '@nestjs/common';
import { PostService } from '../post/post.service';
import { PostStatus } from '../../database/models/post.model';
import { StateVerb } from '../post/dto/requests/update-state.dto';
import { PostUpdateCacheGroupEvent } from '../../events/post/post-update-cache-group.event';
import { InternalEventEmitterService } from '../../app/custom/event-emitter';

@Injectable()
export class InternalService {
  public constructor(
    private _postService: PostService,
    private _eventEmitter: InternalEventEmitterService
  ) {}

  public async getTotalPostByGroupIds(groupIds: string[]): Promise<any> {
    return this._postService.getTotalPostByGroupIds(groupIds);
  }
}
