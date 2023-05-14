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
  tagsIds: string[];
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
        (groupId) => !this._props.groupIds?.includes(groupId)
      );
      this._props.state.detachSeriesIds = this._props.groupIds?.filter(
        (groupId) => !groupIds.includes(groupId)
      );
      this._props.seriesIds = seriesIds;
    }

    if (tagIds) {
      this._props.state.attachTagIds = tagIds.filter(
        (tagId) => !this._props.tagsIds?.includes(tagId)
      );
      this._props.state.detachTagIds = this._props.tagsIds?.filter(
        (tagId) => !tagIds.includes(tagId)
      );
      this._props.tagsIds = tagIds;
    }
  }
}
