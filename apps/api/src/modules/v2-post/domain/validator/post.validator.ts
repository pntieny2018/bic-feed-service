import { Inject, Injectable } from '@nestjs/common';
import { uniq } from 'lodash';
import { RULES } from '../../constant';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
  IMediaRepository,
  ITagRepository,
  MEDIA_REPOSITORY_TOKEN,
  TAG_REPOSITORY_TOKEN,
} from '../repositoty-interface';
import { IPostValidator } from './interface';
import { ContentValidator } from './content.validator';
import { GROUP_APPLICATION_TOKEN, IGroupApplicationService } from '../../../v2-group/application';
import {
  AUTHORITY_APP_SERVICE_TOKEN,
  IAuthorityAppService,
} from '../../../authority/application/authority.app-service.interface';
import { PostEntity } from '../model/content';
import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
  UserDto,
} from '../../../v2-user/application';
import { ContentEmptyException } from '../exception/content-empty.exception';
import { PostLimitAttachedSeriesException } from '../exception';

@Injectable()
export class PostValidator extends ContentValidator implements IPostValidator {
  public constructor(
    @Inject(GROUP_APPLICATION_TOKEN)
    protected _groupAppService: IGroupApplicationService,
    @Inject(USER_APPLICATION_TOKEN)
    protected readonly _userApplicationService: IUserApplicationService,
    @Inject(AUTHORITY_APP_SERVICE_TOKEN)
    protected _authorityAppService: IAuthorityAppService,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    protected readonly _contentRepository: IContentRepository,
    @Inject(TAG_REPOSITORY_TOKEN)
    private readonly _tagRepository: ITagRepository,
    @Inject(MEDIA_REPOSITORY_TOKEN)
    private readonly _mediaRepo: IMediaRepository
  ) {
    super(_groupAppService, _userApplicationService, _authorityAppService, _contentRepository);
  }

  public async validatePublishContent(
    postEntity: PostEntity,
    userAuth: UserDto,
    groupIds: string[]
  ): Promise<void> {
    await super.validatePublishContent(postEntity, userAuth, groupIds);
    if (
      !postEntity.get('content') &&
      postEntity.get('media')?.files.length === 0 &&
      postEntity.get('media')?.videos.length === 0 &&
      postEntity.get('media')?.images.length === 0
    ) {
      throw new ContentEmptyException();
    }
  }

  public async validateAndSetMedia(
    postEntity: PostEntity,
    media?: {
      filesIds?: string[];
      imagesIds?: string[];
      videosIds?: string[];
    }
  ): Promise<void> {
    if (!media) return;
    const mediaEntity = {
      files: [],
      images: [],
      videos: [],
    };
    if (media.filesIds?.length > 0) {
      mediaEntity.files = postEntity.get('media').files;
      const currentFileIds = mediaEntity.files.map((e) => e.get('id'));
      const addingFileIds = media.filesIds.filter((id) => !currentFileIds.includes(id));
      if (addingFileIds.length) {
        const files = await this._mediaRepo.findFiles(addingFileIds);
        const availableFiles = files.filter((image) => image.isOwner(postEntity.get('createdBy')));
        mediaEntity.files.push(...availableFiles);
      }

      const removingFileIds = currentFileIds.filter((id) => !media.filesIds.includes(id));
      if (removingFileIds.length) {
        mediaEntity.files = mediaEntity.files.filter((e) => !removingFileIds.includes(e.get('id')));
      }
    }

    if (media.imagesIds?.length > 0) {
      mediaEntity.images = postEntity.get('media').images || [];
      const currentImageIds = mediaEntity.images.map((e) => e.get('id'));
      const addingImageIds = media.imagesIds.filter((id) => !currentImageIds.includes(id));
      if (addingImageIds.length) {
        const images = await this._mediaRepo.findImages(addingImageIds);
        const availableImages = images.filter(
          (image) => image.isOwner(postEntity.get('createdBy')) && image.isReady()
        );
        mediaEntity.images.push(...availableImages);
      }
      const removingImageIds = currentImageIds.filter((id) => !media.imagesIds.includes(id));
      if (removingImageIds.length) {
        mediaEntity.images = mediaEntity.images.filter(
          (e) => !removingImageIds.includes(e.get('id'))
        );
      }
    }

    if (media.videosIds?.length > 0) {
      mediaEntity.videos = postEntity.get('media').videos;
      const currentVideoIds = mediaEntity.videos.map((e) => e.get('id'));
      const addingVideoIds = media.videosIds.filter((id) => !currentVideoIds.includes(id));
      if (addingVideoIds.length) {
        const videos = await this._mediaRepo.findVideos(addingVideoIds);
        const availableVideos = videos.filter((video) =>
          video.isOwner(postEntity.get('createdBy'))
        );
        mediaEntity.videos.push(...availableVideos);
      }
      const removingVideoIds = currentVideoIds.filter((id) => !media.videosIds.includes(id));
      if (removingVideoIds.length) {
        mediaEntity.videos = mediaEntity.videos.filter(
          (e) => !removingVideoIds.includes(e.get('id'))
        );
      }
    }
    postEntity.setMedia(mediaEntity);
  }

  public async validateLimtedToAttachSeries(postEntity: PostEntity): Promise<void> {
    if (postEntity.isOverLimtedToAttachSeries()) {
      throw new PostLimitAttachedSeriesException(RULES.LIMIT_ATTACHED_SERIES);
    }

    const contentWithArchivedGroups = (await this._contentRepository.findOne({
      where: {
        id: postEntity.getId(),
        groupArchived: true,
      },
      include: {
        shouldIncludeSeries: true,
      },
    })) as PostEntity;

    if (!contentWithArchivedGroups) return;

    const series = uniq([
      ...postEntity.getSeriesIds(),
      ...contentWithArchivedGroups?.getSeriesIds(),
    ]);

    if (series.length > RULES.LIMIT_ATTACHED_SERIES) {
      throw new PostLimitAttachedSeriesException(RULES.LIMIT_ATTACHED_SERIES);
    }
  }
}
