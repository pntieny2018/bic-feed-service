import { ImageEntity } from '../media';
import { CategoryEntity } from '../category';
import { ContentEntity, ContentProps } from './content.entity';
import { PublishPostCommandPayload } from '../../../application/command/publish-post/publish-post.command';
import { TagEntity } from '../tag';

export type ArticleProps = ContentProps & {
  title: string;
  summary: string;
  content: string;
  categories: CategoryEntity[];
  cover: ImageEntity;
  seriesIds: string[];
  tags: TagEntity[];
};

export class ArticleEntity extends ContentEntity<ArticleProps> {
  public constructor(props: ArticleProps) {
    super(props);
  }

  public updateAttribute(data: PublishPostCommandPayload): void {
    const { authUser, content, seriesIds, groupIds } = data;
    super.update({
      authUser,
      groupIds,
    });

    if (content) this._props.content = content;
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

  public getSeriesIds(): string[] {
    return this._props.seriesIds;
  }

  public getTitle(): string {
    return this._props.title;
  }

  public setCategories(categoryEntities: CategoryEntity[]): void {
    this._props.categories = categoryEntities;
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
}
