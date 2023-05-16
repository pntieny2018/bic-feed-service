import { Inject, Logger } from '@nestjs/common';
import { DatabaseException } from '../../../../common/exceptions/database.exception';
import { IPostFactory, POST_FACTORY_TOKEN } from '../factory/interface';
import { IPostDomainService, PostCreateProps, PostPublishProps } from './interface';
import { PostEntity } from '../model/content';
import {
  IPostRepository,
  POST_REPOSITORY_TOKEN,
} from '../repositoty-interface/post.repository.interface';
import { IPostValidator, POST_VALIDATOR_TOKEN } from '../validator/interface';
import { GROUP_APPLICATION_TOKEN, IGroupApplicationService } from '../../../v2-group/application';
import { IUserApplicationService, USER_APPLICATION_TOKEN } from '../../../v2-user/application';

export class PostDomainService implements IPostDomainService {
  private readonly _logger = new Logger(PostDomainService.name);

  @Inject(POST_REPOSITORY_TOKEN)
  private readonly _postRepository: IPostRepository;
  @Inject(POST_FACTORY_TOKEN)
  private readonly _postFactory: IPostFactory;
  @Inject(POST_VALIDATOR_TOKEN)
  private readonly _postValidator: IPostValidator;
  @Inject(USER_APPLICATION_TOKEN)
  private readonly _userApplicationService: IUserApplicationService;
  @Inject(GROUP_APPLICATION_TOKEN)
  private readonly _groupApplicationService: IGroupApplicationService;

  public async createDraftPost(input: PostCreateProps): Promise<PostEntity> {
    const { groups, userId } = input;
    const postEntity = this._postFactory.createDraftPost({
      groupIds: [],
      userId,
    });
    postEntity.setGroups(groups.map((group) => group.id));
    postEntity.setPrivacyFromGroups(groups);
    try {
      await this._postRepository.upsert(postEntity);
      postEntity.commit();
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
    return postEntity;
  }

  public async publishPost(input: PostPublishProps): Promise<PostEntity> {
    const { postEntity, newData } = input;
    const { authUser, mentionUserIds, tagIds, seriesIds, media, content, groupIds } = newData;
    postEntity.update(newData);
    if (!postEntity.isChanged()) return postEntity;
    //TODO: validate media
    await this._postValidator.validatePublishContent(postEntity, authUser, groupIds);
    if (postEntity.get('mentionUserIds')) {
      await this._postValidator.validateMentionUsers(
        postEntity.get('mentionUserIds'),
        postEntity.get('groupIds')
      );
    }

    const groups = await this._groupApplicationService.findAllByIds(postEntity.get('groupIds'));

    if (seriesIds || tagIds) {
      await this._postValidator.validateSeriesAndTags(groups, seriesIds, tagIds);
    }

    postEntity.setPrivacyFromGroups(groups);
    postEntity.setPublish();
    await this._postRepository.upsert(postEntity);
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
