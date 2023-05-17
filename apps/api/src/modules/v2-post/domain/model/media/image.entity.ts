import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { validate as isUUID } from 'uuid';
import { DomainModelException } from '../../../../../common/exceptions/domain-model.exception';
import { ImageResource } from '../../../data-type';

export type ImageProps = {
  id: string;
  url: string;
  src: string;
  createdBy: string;
  mimeType: string;
  resource: ImageResource;
  width: number;
  height: number;
  status: string;
};

export class ImageEntity extends DomainAggregateRoot<ImageProps> {
  public constructor(props: ImageProps) {
    super(props);
  }

  public validate(): void {
    if (!isUUID(this._props.id)) {
      throw new DomainModelException(`ID must be UUID`);
    }
  }

  public isOwner(userId: string): boolean {
    return this._props.createdBy === userId;
  }

  public isReady(): boolean {
    return this._props.status === 'DONE';
  }

  public isPostContentResource(): boolean {
    return this._props.resource === ImageResource.POST_CONTENT;
  }

  public isArticleContentResource(): boolean {
    return this._props.resource === ImageResource.ARTICLE_CONTENT;
  }

  public isArticleCoverResource(): boolean {
    return this._props.resource === ImageResource.ARTICLE_COVER;
  }

  public isSeriesCoverResource(): boolean {
    return this._props.resource === ImageResource.SERIES_COVER;
  }

  public isCommentContentResource(): boolean {
    return this._props.resource === ImageResource.COMMENT_CONTENT;
  }
}
