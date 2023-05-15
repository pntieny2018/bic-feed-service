import { ContentEntity, ContentProps } from './content.entity';
import { FileEntity, ImageEntity, VideoEntity } from '../media';
import { PublishPostCommandPayload } from '../../../application/command/publish-post/publish-post.command';

export type PostProps = ContentProps & {
  media: {
    files: FileEntity[];
    images: ImageEntity[];
    videos: VideoEntity[];
  };
  content: string;
  mentionUserIds?: string[];
  linkPreview?: string;
  seriesIds: string[];
  tags: {
    id: string;
    name?: string;
    slug?: string;
  }[];
};

export class PostEntity extends ContentEntity<PostProps> {
  public constructor(props: PostProps) {
    super(props);
  }

  public update(data: PublishPostCommandPayload): void {
    const { authUser, content, seriesIds, tagIds, media, groupIds, setting, mentionUserIds } = data;
    super.update({
      authUser,
      setting,
      groupIds,
    });

    if (content) this._props.content = content;
    if (mentionUserIds) this._props.mentionUserIds = mentionUserIds;

    if (seriesIds) {
      this._props.state.attachSeriesIds = seriesIds.filter(
        (seriesId) => !this._props.seriesIds?.includes(seriesId)
      );
      this._props.state.detachSeriesIds = this._props.seriesIds?.filter(
        (seriesId) => !seriesIds.includes(seriesId)
      );
      this._props.seriesIds = seriesIds;
    }

    if (tagIds) {
      console.log('tags', tagIds);
      console.log('this._props.tags', this._props.tags);
      const entityTagIds = this._props.tags.map((tag) => tag.id);
      this._props.state.attachTagIds = tagIds.filter((tagId) => !entityTagIds?.includes(tagId));
      this._props.state.detachTagIds = entityTagIds?.filter((tagId) => !tagIds.includes(tagId));
      this._props.tags = tagIds.map((tagId) => ({
        id: tagId,
      }));
    }
  }
}
