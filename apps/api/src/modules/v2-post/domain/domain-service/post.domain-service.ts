import { Inject, Logger } from '@nestjs/common';
import { DatabaseException } from '../../../../common/exceptions/database.exception';
import { IPostFactory, POST_FACTORY_TOKEN } from '../factory/interface';
import { IPostDomainService, PostCreateProps, PostPublishProps } from './interface';
import { PostEntity, PostProps } from '../model/post';
import {
  IPostRepository,
  POST_REPOSITORY_TOKEN,
} from '../repositoty-interface/post.repository.interface';
import { PublishPostCommandPayload } from '../../application/command/publish-post/publish-post.command';
import { IPostValidator, POST_VALIDATOR_TOKEN } from '../validator/interface';
import {
  GROUP_APPLICATION_TOKEN,
  GroupDto,
  IGroupApplicationService,
} from '../../../v2-group/application';
import { IUserApplicationService, USER_APPLICATION_TOKEN } from '../../../v2-user/application';

export class PostDomainService implements IPostDomainService {
  private readonly _logger = new Logger(PostDomainService.name);

  @Inject(POST_REPOSITORY_TOKEN)
  private readonly _postRepository: IPostRepository;
  @Inject(POST_FACTORY_TOKEN)
  private readonly _postFactory: IPostFactory;
  @Inject(POST_VALIDATOR_TOKEN)
  private readonly _postValidator: IPostValidator;

  public async createDraftPost(input: PostCreateProps): Promise<PostEntity> {
    const { groups, userId } = input;
    const postEntity = this._postFactory.createDraftPost({
      groupIds: groups.map((group) => group.id),
      userId,
    });
    postEntity.setPrivacyFromGroups(groups);
    try {
      await this._postRepository.createPost(postEntity);
      postEntity.commit();
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
    return postEntity;
  }

  public async publishPost(input: PostPublishProps): Promise<PostEntity> {
    const { postEntity, newData, groups } = input;
    const { authUser, mentionUserIds, tagIds, seriesIds, media, content, groupIds } = newData;
    postEntity.update(newData);
    //TODO: validate media
    await this._postValidator.validatePublishContent(postEntity, authUser, groupIds);
    postEntity.setPrivacyFromGroups(groups);
    postEntity.setPublish();
    await this._postRepository.updatePost(postEntity);

    postEntity.commit();
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
