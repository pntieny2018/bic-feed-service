import { CONTENT_STATUS, CONTENT_TYPE } from '@beincom/constants';
import { v4 } from 'uuid';

import { RULES } from '../../../constant';
import { LinkPreviewEntity } from '../link-preview';
import { FileEntity, ImageEntity, VideoEntity } from '../media';
import { TagEntity } from '../tag';

import { ContentEntity, ContentAttributes } from './content.entity';
import { StringHelper } from '@libs/common/helpers';

export type PostAttributes = ContentAttributes & {
  media: {
    files: FileEntity[];
    images: ImageEntity[];
    videos: VideoEntity[];
  };
  content: string;
  mentionUserIds?: string[];
  linkPreview?: LinkPreviewEntity;
  seriesIds: string[];
  tags: TagEntity[];
  videoIdProcessing?: string;
};

export class PostEntity extends ContentEntity<PostAttributes> {
  public constructor(props: PostAttributes) {
    super(props);
  }

  public static create(userId: string): PostEntity {
    const now = new Date();
    return new PostEntity({
      id: v4(),
      groupIds: [],
      content: null,
      title: null,
      createdBy: userId,
      updatedBy: userId,
      aggregation: {
        commentsCount: 0,
        totalUsersSeen: 0,
      },
      type: CONTENT_TYPE.POST,
      status: CONTENT_STATUS.DRAFT,
      media: {
        files: [],
        images: [],
        videos: [],
      },
      isHidden: false,
      isReported: false,
      privacy: null,
      setting: {
        canComment: true,
        canReact: true,
        importantExpiredAt: null,
        isImportant: false,
      },
      createdAt: now,
      updatedAt: now,
      mentionUserIds: [],
      linkPreview: null,
      seriesIds: [],
      tags: [],
      wordCount: 0,
    });
  }
  public updateAttribute(data: Partial<PostAttributes>, userId: string): void {
    const { content, seriesIds, groupIds, mentionUserIds } = data;
    const authUser = { id: userId };
    super.update({
      authUser,
      groupIds,
    });

    if (content) {
      this._props.content = content;
      this._props.title = StringHelper.getRawTextFromMarkdown(content).slice(0, 500);
    }
    if (mentionUserIds) {
      this._props.mentionUserIds = mentionUserIds;
    }
    if (seriesIds) {
      this._state.attachSeriesIds = seriesIds.filter(
        (seriesId) => !this._props.seriesIds?.includes(seriesId)
      );
      this._state.detachSeriesIds = this._props.seriesIds?.filter(
        (seriesId) => !seriesIds.includes(seriesId)
      );
      this._props.seriesIds = seriesIds;
    }
  }

  public setLinkPreview(linkPreview: LinkPreviewEntity): void {
    this._props.linkPreview = linkPreview;
  }

  public getSeriesIds(): string[] {
    return this._props.seriesIds || [];
  }

  public setSeriesIds(seriesIds: string[]): void {
    this._props.seriesIds = seriesIds;
  }

  public getTags(): TagEntity[] {
    return this._props.tags || [];
  }

  public setTags(newTags: TagEntity[]): void {
    if (!newTags) {
      return;
    }
    const entityTagIds = this._props.tags?.map((tag) => tag.get('id')) || [];
    for (const tag of newTags) {
      if (!entityTagIds.includes(tag.get('id'))) {
        this._state.attachTagIds.push(tag.get('id'));
      }
    }

    const newTagIds = newTags.map((tag) => tag.get('id'));
    for (const tagId of entityTagIds) {
      if (!newTagIds.includes(tagId)) {
        this._state.detachTagIds.push(tagId);
      }
    }
    this._props.tags = newTags;
  }

  public hasVideoProcessing(): boolean {
    return (this._props.media.videos || []).some((video) => !video.isProcessed());
  }

  public setMedia(media: {
    files: FileEntity[];
    images: ImageEntity[];
    videos: VideoEntity[];
  }): void {
    const { files, images, videos } = media;
    this._updateVideosState(videos);
    this._updateFilesState(files);
    this._updateImagesState(images);
  }
  private _updateFilesState(files: FileEntity[]): void {
    const currentFileIds = (this._props.media.files || []).map((file) => file.get('id'));
    for (const file of files) {
      if (!currentFileIds.includes(file.get('id'))) {
        this._state.attachFileIds.push(file.get('id'));
      }
    }

    const newFileIds = files.map((file) => file.get('id'));
    for (const fileId of currentFileIds) {
      if (!newFileIds.includes(fileId)) {
        this._state.detachFileIds.push(fileId);
      }
    }
    this._props.media = {
      ...this._props.media,
      files,
    };
  }

  private _updateImagesState(images: ImageEntity[]): void {
    const currentImageIds = (this._props.media.images || []).map((image) => image.get('id'));
    for (const image of images) {
      if (!currentImageIds.includes(image.get('id'))) {
        this._state.attachImageIds.push(image.get('id'));
      }
    }

    const newImageIds = images.map((image) => image.get('id'));
    for (const imageId of currentImageIds) {
      if (!newImageIds.includes(imageId)) {
        this._state.detachImageIds.push(imageId);
      }
    }
    this._props.media = {
      ...this._props.media,
      images,
    };
  }

  public getVideoIdProcessing(): string | undefined {
    return this._props.videoIdProcessing;
  }

  private _updateVideosState(videos: VideoEntity[]): void {
    const currentVideoIds = (this._props.media.videos || []).map((video) => video.get('id'));
    for (const video of videos) {
      if (!currentVideoIds.includes(video.get('id'))) {
        this._state.attachVideoIds.push(video.get('id'));
      }

      if (!video.isProcessed()) {
        this._props.videoIdProcessing = video.get('id');
      } else {
        this._props.videoIdProcessing = null;
      }
    }

    const newVideoIds = videos.map((video) => video.get('id'));
    for (const videoId of currentVideoIds) {
      if (!newVideoIds.includes(videoId)) {
        this._state.detachVideoIds.push(videoId);
      }
    }
    this._props.media = {
      ...this._props.media,
      videos,
    };
  }

  public isOverLimitedToAttachSeries(): boolean {
    return this._props.seriesIds && this._props.seriesIds.length > RULES.LIMIT_ATTACHED_SERIES;
  }

  public getContent(): string {
    return this._props.content;
  }
}
