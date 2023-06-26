import { TagEntity } from '../tag';
import { difference, isEmpty } from 'lodash';
import { ImageEntity } from '../media';
import { CategoryEntity } from '../category';
import { ContentEntity, ContentProps } from './content.entity';
import { UpdateArticleCommandPayload } from '../../../application/command/update-article/update-article.command';

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

  public updateAttribute(data: UpdateArticleCommandPayload): void {
    const { actor, content, series, title, summary, wordCount } = data;
    super.update({ authUser: actor });

    if (series) {
      const currentSeries = this._props.seriesIds || [];
      this._state.attachSeriesIds = difference(series, currentSeries);
      this._state.detachSeriesIds = difference(currentSeries, series);
      this._props.seriesIds = series;
    }

    if (content) this._props.content = content;
    if (title) this._props.title = title;
    if (summary) this._props.summary = summary;
    if (wordCount) this._props.wordCount = wordCount;
  }

  public getSeriesIds(): string[] {
    return this._props.seriesIds;
  }

  public getTitle(): string {
    return this._props.title;
  }

  public setCategories(categoryEntities: CategoryEntity[]): void {
    const entityIds = (this._props.categories || []).map((category) => category.get('id'));
    const newEntiyIds = (categoryEntities || []).map((category) => category.get('id'));

    this._state.attachCategoryIds = difference(newEntiyIds, entityIds);
    this._state.detachCategoryIds = difference(entityIds, newEntiyIds);

    this._props.categories = categoryEntities;
  }

  public setTags(newTags: TagEntity[]): void {
    const entityTagIds = (this._props.tags || []).map((tag) => tag.get('id'));
    const newTagIds = newTags.map((tag) => tag.get('id'));

    this._state.attachTagIds = difference(newTagIds, entityTagIds);
    this._state.detachTagIds = difference(entityTagIds, newTagIds);

    this._props.tags = newTags;
  }

  public setCover(coverMedia: ImageEntity): void {
    this._props.cover = coverMedia;
  }

  public isValidArticleToPublish(): boolean {
    return !(
      (this.isPublished() || this.isWaitingSchedule()) &&
      (isEmpty(this._props.content) ||
        isEmpty(this._props.cover) ||
        isEmpty(this._props.title) ||
        isEmpty(this._props.categories) ||
        isEmpty(this._props.groupIds))
    );
  }
}
