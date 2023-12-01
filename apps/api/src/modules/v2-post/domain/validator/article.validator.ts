import { UserDto } from '@libs/service/user';
import { Inject, Injectable } from '@nestjs/common';

import { ContentEmptyContentException } from '../exception';
import { ArticleEntity } from '../model/content';
import { GROUP_ADAPTER, IGroupAdapter } from '../service-adapter-interface';

import { CONTENT_VALIDATOR_TOKEN, IArticleValidator, IContentValidator } from './interface';

@Injectable()
export class ArticleValidator implements IArticleValidator {
  public constructor(
    @Inject(GROUP_ADAPTER)
    protected _groupAdapter: IGroupAdapter,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator
  ) {}

  public async validateArticleToPublish(
    articleEntity: ArticleEntity,
    actor: UserDto
  ): Promise<void> {
    const groupIds = articleEntity.get('groupIds');

    await this._contentValidator.validatePublishContent(articleEntity, actor, groupIds);

    if (!articleEntity.isValidArticleToPublish()) {
      throw new ContentEmptyContentException();
    }
  }
}
