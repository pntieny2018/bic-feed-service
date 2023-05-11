import { Inject, Logger } from '@nestjs/common';
import { DatabaseException } from '../../../../common/exceptions/database.exception';
import { IPostFactory, POST_FACTORY_TOKEN } from '../factory/interface';
import { IPostDomainService, PostCreateProps } from './interface';
import { PostEntity } from '../model/post';
import {
  IPostRepository,
  POST_REPOSITORY_TOKEN,
} from '../repositoty-interface/post.repository.interface';

export class PostDomainService implements IPostDomainService {
  private readonly _logger = new Logger(PostDomainService.name);

  @Inject(POST_REPOSITORY_TOKEN)
  private readonly _postRepository: IPostRepository;
  @Inject(POST_FACTORY_TOKEN)
  private readonly _postFactory: IPostFactory;

  public async createDraftPost(input: PostCreateProps): Promise<PostEntity> {
    const { groupIds, userId } = input;
    const postEntity = this._postFactory.createDraft({
      groupIds,
      userId,
    });
    try {
      await this._postRepository.createPost(postEntity);
      postEntity.commit();
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
    return postEntity;
  }

  public async delete(id: string): Promise<void> {
    try {
      await this._postRepository.delete(id);
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
  }
}
