import { IMAGE_RESOURCE } from '@beincom/constants';
import { validate as isUUID } from 'uuid';

import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { DomainModelException } from '../../../../../common/exceptions';
import { ImageResource } from '../../../data-type';

export type ImageAttributes = {
  id: string;
  url: string;
  src?: string;
  createdBy: string;
  mimeType: string;
  resource: ImageResource | IMAGE_RESOURCE;
  width: number;
  height: number;
  status: string;
};

export class ImageEntity extends DomainAggregateRoot<ImageAttributes> {
  public constructor(props: ImageAttributes) {
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
