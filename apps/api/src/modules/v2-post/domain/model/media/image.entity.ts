import { IMAGE_RESOURCE, MEDIA_PROCESS_STATUS } from '@beincom/constants';
import { validate as isUUID } from 'uuid';

import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { DomainModelException } from '../../../../../common/exceptions';

export type ImageAttributes = {
  id: string;
  url: string;
  src?: string;
  createdBy: string;
  mimeType: string;
  resource: IMAGE_RESOURCE;
  width: number;
  height: number;
  status: MEDIA_PROCESS_STATUS;
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
    return this._props.status === MEDIA_PROCESS_STATUS.COMPLETED;
  }

  public isPostContentResource(): boolean {
    return this._props.resource === IMAGE_RESOURCE.POST_CONTENT;
  }

  public isArticleContentResource(): boolean {
    return this._props.resource === IMAGE_RESOURCE.ARTICLE_CONTENT;
  }

  public isArticleCoverResource(): boolean {
    return this._props.resource === IMAGE_RESOURCE.ARTICLE_COVER;
  }

  public isSeriesCoverResource(): boolean {
    return this._props.resource === IMAGE_RESOURCE.SERIES_COVER;
  }

  public isCommentContentResource(): boolean {
    return this._props.resource === IMAGE_RESOURCE.COMMENT_CONTENT;
  }
}
