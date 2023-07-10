import { Inject, Logger } from '@nestjs/common';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../repositoty-interface';
import { ContentEntity } from '../model/content/content.entity';
import { IContentDomainService } from './interface/content.domain-service.interface';
import { ContentNotFoundException } from '../exception';
import { ArticleEntity, PostEntity } from '../model/content';
import { StringHelper } from '../../../../common/helpers';
import { UserDto } from '../../../v2-user/application';

export class ContentDomainService implements IContentDomainService {
  private readonly _logger = new Logger(ContentDomainService.name);

  @Inject(CONTENT_REPOSITORY_TOKEN)
  private readonly _contentRepository: IContentRepository;

  public async getVisibleContent(id: string): Promise<ContentEntity> {
    const entity = await this._contentRepository.findOne({
      include: {
        mustIncludeGroup: true,
      },
      where: {
        id,
      },
    });

    if (!entity || !entity.isVisible()) {
      throw new ContentNotFoundException();
    }
    return entity;
  }

  public getRawContent(contentEntity: ContentEntity): string {
    if (contentEntity instanceof PostEntity) {
      return StringHelper.removeMarkdownCharacter(contentEntity.get('content'));
    } else if (contentEntity instanceof ArticleEntity) {
      return StringHelper.serializeEditorContentToText(contentEntity.get('content'));
    }
    return null;
  }
}
