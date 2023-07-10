import { ContentEntity, ContentProps } from './content.entity';
import { FileEntity, ImageEntity, VideoEntity } from '../media';
import { PublishPostCommandPayload } from '../../../application/command/publish-post/publish-post.command';
import { LinkPreviewEntity } from '../link-preview';
import { TagEntity } from '../tag';

export type PostProps = ContentProps & {
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

export class PostEntity extends ContentEntity<PostProps> {
  public constructor(props: PostProps) {
    super(props);
  }

  public updateAttribute(data: PublishPostCommandPayload): void {
    const { authUser, content, seriesIds, groupIds, mentionUserIds } = data;
    super.update({
      authUser,
      groupIds,
    });

    if (content) this._props.content = content;
    if (mentionUserIds) this._props.mentionUserIds = mentionUserIds;
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

  public getTitle(): string {
    return '';
  }

  public getSeriesIds(): string[] {
    return this._props.seriesIds;
  }

  public setTags(newTags: TagEntity[]): void {
    if (!newTags) return;
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
    return this._props.media.videos.some((video) => !video.isProcessed());
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
        if (!video.isProcessed()) {
          this._props.videoIdProcessing = video.get('id');
        }
        this._state.attachVideoIds.push(video.get('id'));
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
}
