import { Inject, Logger } from '@nestjs/common';
import { DatabaseException } from '../../../../common/exceptions/database.exception';
import { IPostFactory, POST_FACTORY_TOKEN } from '../factory/interface';
import { IPostDomainService, PostCreateProps, PostPublishProps } from './interface';
import { PostEntity } from '../model/content';
import {
  IPostRepository,
  ITagRepository,
  POST_REPOSITORY_TOKEN,
  TAG_REPOSITORY_TOKEN,
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
import {
  IMediaRepository,
  MEDIA_REPOSITORY_TOKEN,
} from '../repositoty-interface/media.repository.interface';
import { FileEntity, ImageEntity, VideoEntity } from '../model/media';
import { InvalidResourceImageException } from '../exception/invalid-resource-image.exception';
import {
  IMediaDomainService,
  MEDIA_DOMAIN_SERVICE_TOKEN,
} from './interface/media.domain-service.interface';

export class PostDomainService implements IPostDomainService {
  private readonly _logger = new Logger(PostDomainService.name);

  @Inject(POST_REPOSITORY_TOKEN)
  private readonly _postRepository: IPostRepository;
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
      await this._postRepository.create(postEntity);
      postEntity.commit();
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
    return postEntity;
  }

  public async publishPost(input: PostPublishProps): Promise<PostEntity> {
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

    if (!postEntity.isChanged()) return postEntity;
    await this._postRepository.update(postEntity);
    postEntity.commit();
    return postEntity;
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
    await this._postValidator.validateAndSetMedia(postEntity, media);
    if (linkPreview?.url !== postEntity.get('linkPreview')?.get('url')) {
      const linkPreviewEntity = await this._linkPreviewDomainService.findOrUpsert(linkPreview);
      postEntity.setLinkPreview(linkPreviewEntity);
    }

    postEntity.updateAttribute(newData);
    postEntity.setPrivacyFromGroups(groups);

    if (!postEntity.isChanged()) return;
    await this._postRepository.update(postEntity);
    postEntity.commit();
  }

  public async delete(id: string): Promise<void> {
    try {
      await this._postRepository.delete(id);
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
  }

  private async _getAvailableVideos(
    postEntity: PostEntity,
    videosIds?: string[]
  ): Promise<VideoEntity[]> {
    if (!videosIds || videosIds?.length === 0) return [];
    let result = [];

    result = postEntity.get('media').videos;
    const currentVideoIds = result.map((e) => e.get('id'));
    const addingVideoIds = videosIds.filter((id) => !currentVideoIds.includes(id));
    if (addingVideoIds.length) {
      const videos = await this._mediaRepo.findVideos(addingVideoIds);
      const availableVideos = videos.filter((video) => video.isOwner(postEntity.get('createdBy')));
      videos.push(...availableVideos);
    }
    const removingVideoIds = currentVideoIds.filter((id) => !videosIds.includes(id));
    if (removingVideoIds.length) {
      result = result.filter((e) => !removingVideoIds.includes(e.get('id')));
    }
    return result;
  }

  private async _getAvailableFiles(
    postEntity: PostEntity,
    filesIds: string[]
  ): Promise<FileEntity[]> {
    if (!filesIds || filesIds.length === 0) return [];
    let result = [];
    result = postEntity.get('media').files;
    const currentFileIds = result.map((e) => e.get('id'));
    const addingFileIds = filesIds.filter((id) => !currentFileIds.includes(id));
    if (addingFileIds.length) {
      const files = await this._mediaRepo.findFiles(addingFileIds);
      const availableFiles = files.filter((image) => image.isOwner(postEntity.get('createdBy')));
      files.push(...availableFiles);
    }

    const removingFileIds = currentFileIds.filter((id) => !filesIds.includes(id));
    if (removingFileIds.length) {
      result = result.filter((e) => !removingFileIds.includes(e.get('id')));
    }
    return result;
  }

  private async _getAvailableImages(
    postEntity: PostEntity,
    imagesIds?: string[]
  ): Promise<ImageEntity[]> {
    if (!imagesIds || imagesIds.length === 0) return [];
    let result = [];
    result = postEntity.get('media').images || [];
    const currentImageIds = result.map((e) => e.get('id'));
    const addingImageIds = imagesIds.filter((id) => !currentImageIds.includes(id));
    if (addingImageIds.length) {
      const images = await this._mediaRepo.findImages(addingImageIds);
      const availableImages = images.filter(
        (image) => image.isOwner(postEntity.get('createdBy')) && image.isReady()
      );
      result.push(...availableImages);
    }

    const removingImageIds = currentImageIds.filter((id) => !imagesIds.includes(id));
    if (removingImageIds.length) {
      result = result.filter((e) => !removingImageIds.includes(e.get('id')));
    }
    return result;
  }
}
