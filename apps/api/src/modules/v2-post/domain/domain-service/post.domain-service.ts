import { Inject, Logger } from '@nestjs/common';
import { DatabaseException } from '../../../../common/exceptions/database.exception';
import { IPostFactory, POST_FACTORY_TOKEN } from '../factory/interface';
import { IPostDomainService, PostCreateProps, PostPublishProps } from './interface';
import { PostEntity } from '../model/content';
import {
  IContentRepository,
  ITagRepository,
  IMediaRepository,
  CONTENT_REPOSITORY_TOKEN,
  TAG_REPOSITORY_TOKEN,
  MEDIA_REPOSITORY_TOKEN,
} from '../repositoty-interface';
import {
  IMentionValidator,
  IPostValidator,
  MENTION_VALIDATOR_TOKEN,
  POST_VALIDATOR_TOKEN,
} from '../validator/interface';
import { GROUP_APPLICATION_TOKEN, IGroupApplicationService } from '../../../v2-group/application';
import { IUserApplicationService, USER_APPLICATION_TOKEN } from '../../../v2-user/application';
import {
  ILinkPreviewDomainService,
  LINK_PREVIEW_DOMAIN_SERVICE_TOKEN,
} from './interface/link-preview.domain-service.interface';
import { InvalidResourceImageException } from '../exception/invalid-resource-image.exception';
import {
  IMediaDomainService,
  MEDIA_DOMAIN_SERVICE_TOKEN,
} from './interface/media.domain-service.interface';
import { ContentEntity } from '../model/content/content.entity';

export class PostDomainService implements IPostDomainService {
  private readonly _logger = new Logger(PostDomainService.name);

  @Inject(CONTENT_REPOSITORY_TOKEN)
  private readonly _contentRepository: IContentRepository;
  @Inject(POST_FACTORY_TOKEN)
  private readonly _postFactory: IPostFactory;
  @Inject(POST_VALIDATOR_TOKEN)
  private readonly _postValidator: IPostValidator;
  @Inject(MENTION_VALIDATOR_TOKEN)
  private readonly _mentionValidator: IMentionValidator;
  @Inject(USER_APPLICATION_TOKEN)
  private readonly _userApplicationService: IUserApplicationService;
  @Inject(GROUP_APPLICATION_TOKEN)
  private readonly _groupApplicationService: IGroupApplicationService;
  @Inject(LINK_PREVIEW_DOMAIN_SERVICE_TOKEN)
  private readonly _linkPreviewDomainService: ILinkPreviewDomainService;
  @Inject(MEDIA_REPOSITORY_TOKEN)
  private readonly _mediaRepo: IMediaRepository;
  @Inject(TAG_REPOSITORY_TOKEN)
  private readonly _tagRepo: ITagRepository;
  @Inject(MEDIA_DOMAIN_SERVICE_TOKEN) private readonly _mediaDomainService: IMediaDomainService;

  public async createDraftPost(input: PostCreateProps): Promise<PostEntity> {
    const { groups, userId } = input;
    const postEntity = this._postFactory.createDraftPost({
      groupIds: [],
      userId,
    });
    postEntity.setGroups(groups.map((group) => group.id));
    postEntity.setPrivacyFromGroups(groups);
    try {
      await this._contentRepository.create(postEntity);
      postEntity.commit();
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
    return postEntity;
  }

  public async publishPost(input: PostPublishProps): Promise<void> {
    const { postEntity, newData } = input;
    const { authUser, mentionUsers, tagIds, linkPreview, groups, media } = newData;

    let newTagEntities = [];
    if (tagIds) {
      newTagEntities = await this._tagRepo.findAll({
        ids: tagIds,
      });
      postEntity.setTags(newTagEntities);
    }
    if (media) {
      const images = await this._mediaDomainService.getAvailableImages(
        postEntity.get('media').images,
        media?.imagesIds,
        postEntity.get('createdBy')
      );
      if (images.some((image) => !image.isPostContentResource())) {
        throw new InvalidResourceImageException();
      }
      const files = await this._mediaDomainService.getAvailableFiles(
        postEntity.get('media').files,
        media?.filesIds,
        postEntity.get('createdBy')
      );
      const videos = await this._mediaDomainService.getAvailableVideos(
        postEntity.get('media').videos,
        media?.videosIds,
        postEntity.get('createdBy')
      );
      postEntity.setMedia({
        files,
        images,
        videos,
      });
    }
    if (linkPreview?.url !== postEntity.get('linkPreview')?.get('url')) {
      const linkPreviewEntity = await this._linkPreviewDomainService.findOrUpsert(linkPreview);
      postEntity.setLinkPreview(linkPreviewEntity);
    }

    postEntity.updateAttribute(newData);
    postEntity.setPrivacyFromGroups(groups);
    if (postEntity.hasVideoProcessing()) {
      postEntity.setProcessing();
    } else {
      postEntity.setPublish();
    }

    await this._postValidator.validatePublishContent(
      postEntity,
      authUser,
      postEntity.get('groupIds')
    );
    await this._mentionValidator.validateMentionUsers(mentionUsers, groups);
    await this._postValidator.validateSeriesAndTags(
      groups,
      postEntity.get('seriesIds'),
      postEntity.get('tags')
    );

    if (!postEntity.isChanged()) return;
    await this._contentRepository.update(postEntity);

    postEntity.commit();
  }

  public async markSeen(contentEntity: ContentEntity, userId: string): Promise<void> {
    await this._contentRepository.markSeen(contentEntity.getId(), userId);
  }

  public async markReadImportant(contentEntity: ContentEntity, userId: string): Promise<void> {
    await this._contentRepository.markReadImportant(contentEntity.getId(), userId);
  }

  public async autoSavePost(input: PostPublishProps): Promise<void> {
    const { postEntity, newData } = input;
    const { tagIds, linkPreview, groups, media } = newData;

    let newTagEntities = [];
    if (tagIds) {
      newTagEntities = await this._tagRepo.findAll({
        ids: tagIds,
      });
      postEntity.setTags(newTagEntities);
    }
    if (media) {
      const images = await this._mediaDomainService.getAvailableImages(
        postEntity.get('media').images,
        media?.imagesIds,
        postEntity.get('createdBy')
      );

      const files = await this._mediaDomainService.getAvailableFiles(
        postEntity.get('media').files,
        media?.filesIds,
        postEntity.get('createdBy')
      );
      const videos = await this._mediaDomainService.getAvailableVideos(
        postEntity.get('media').videos,
        media?.videosIds,
        postEntity.get('createdBy')
      );
      postEntity.setMedia({
        files,
        images,
        videos,
      });
    }
    if (linkPreview?.url !== postEntity.get('linkPreview')?.get('url')) {
      const linkPreviewEntity = await this._linkPreviewDomainService.findOrUpsert(linkPreview);
      postEntity.setLinkPreview(linkPreviewEntity);
    }

    postEntity.updateAttribute(newData);
    postEntity.setPrivacyFromGroups(groups);

    if (!postEntity.isChanged()) return;
    await this._contentRepository.update(postEntity);
    postEntity.commit();
  }

  public async delete(id: string): Promise<void> {
    try {
      await this._contentRepository.delete(id);
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
  }
}
