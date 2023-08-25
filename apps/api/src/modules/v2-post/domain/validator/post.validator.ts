import { Inject, Injectable } from '@nestjs/common';
import { uniq } from 'lodash';

import {
  AUTHORITY_APP_SERVICE_TOKEN,
  IAuthorityAppService,
} from '../../../authority/application/authority.app-service.interface';
import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
  UserDto,
} from '../../../v2-user/application';
import { RULES } from '../../constant';
import { ContentEmptyContentException, PostLimitAttachedSeriesException } from '../exception';
import { PostEntity } from '../model/content';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
  IMediaRepository,
  MEDIA_REPOSITORY_TOKEN,
} from '../repositoty-interface';
import { GROUP_ADAPTER, IGroupAdapter } from '../service-adapter-interface';

import { ContentValidator } from './content.validator';
import { IPostValidator } from './interface';

@Injectable()
export class PostValidator extends ContentValidator implements IPostValidator {
  public constructor(
    @Inject(GROUP_ADAPTER)
    protected _groupAdapter: IGroupAdapter,
    @Inject(USER_APPLICATION_TOKEN)
    protected readonly _userApplicationService: IUserApplicationService,
    @Inject(AUTHORITY_APP_SERVICE_TOKEN)
    protected _authorityAppService: IAuthorityAppService,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    protected readonly _contentRepository: IContentRepository,
    @Inject(MEDIA_REPOSITORY_TOKEN)
    private readonly _mediaRepo: IMediaRepository
  ) {
    super(_groupAdapter, _userApplicationService, _authorityAppService, _contentRepository);
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
      throw new ContentEmptyContentException();
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
    if (!media) {
      return;
    }
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

  public async validateLimitedToAttachSeries(postEntity: PostEntity): Promise<void> {
    if (postEntity.isOverLimitedToAttachSeries()) {
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

    if (!contentWithArchivedGroups) {
      return;
    }

    const series = uniq([
      ...postEntity.getSeriesIds(),
      ...contentWithArchivedGroups?.getSeriesIds(),
    ]);

    if (series.length > RULES.LIMIT_ATTACHED_SERIES) {
      throw new PostLimitAttachedSeriesException(RULES.LIMIT_ATTACHED_SERIES);
    }
  }
}
