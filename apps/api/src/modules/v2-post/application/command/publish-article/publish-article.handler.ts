import { Inject } from '@nestjs/common';
import { KAFKA_TOPIC, KafkaService } from '@app/kafka';
import { ArticleDto, ImageDto, TagDto } from '../../dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PublishArticleCommand } from './publish-article.command';
import { ContentNotFoundException } from '../../../domain/exception';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import { ArticleEntity } from '../../../domain/model/content';
import {
  ARTICLE_DOMAIN_SERVICE_TOKEN,
  IArticleDomainService,
  IPostDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { UserDto } from '../../../../v2-user/application';
import { CONTENT_BINDING_TOKEN } from '../../binding/binding-post/content.interface';
import { ContentBinding } from '../../binding/binding-post/content.binding';
import { ArticleChangedMessagePayload } from '../../dto/message';

@CommandHandler(PublishArticleCommand)
export class PublishArticleHandler implements ICommandHandler<PublishArticleCommand, ArticleDto> {
  public constructor(
    @Inject(ARTICLE_DOMAIN_SERVICE_TOKEN)
    private readonly _articleDomainService: IArticleDomainService,
    @Inject(POST_DOMAIN_SERVICE_TOKEN)
    private readonly _postDomainService: IPostDomainService,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: ContentBinding,
    private readonly _kafkaService: KafkaService
  ) {}

  public async execute(command: PublishArticleCommand): Promise<ArticleDto> {
    const { actor, id } = command.payload;

    const articleEntity = await this._contentRepository.findOne({
      where: {
        id,
        groupArchived: false,
      },
      include: {
        shouldIncludeGroup: true,
        shouldIncludeCategory: true,
        shouldIncludeSeries: true,
      },
    });

    if (
      !articleEntity ||
      !(articleEntity instanceof ArticleEntity) ||
      articleEntity.isHidden() ||
      articleEntity.isInArchivedGroups()
    ) {
      throw new ContentNotFoundException();
    }

    if (articleEntity.isPublished()) {
      return this._contentBinding.articleBinding(articleEntity, { actor, authUser: actor });
    }

    await this._articleDomainService.publish({
      articleEntity,
      newData: command.payload,
    });

    await this._postDomainService.markSeen(articleEntity, actor.id);
    articleEntity.increaseTotalSeen();

    if (articleEntity.isImportant()) {
      await this._postDomainService.markReadImportant(articleEntity, actor.id);
      articleEntity.setMarkReadImportant();
    }

    this._sendEvent(articleEntity, actor);

    return this._contentBinding.articleBinding(articleEntity, { actor, authUser: actor });
  }

  private _sendEvent(entity: ArticleEntity, actor: UserDto): void {
    if (entity.isPublished()) {
      const payload: ArticleChangedMessagePayload = {
        state: 'publish',
        after: {
          id: entity.get('id'),
          actor,
          type: entity.get('type'),
          setting: entity.get('setting'),
          groupIds: entity.get('groupIds'),
          communityIds: entity.get('communityIds'),
          seriesIds: entity.get('seriesIds'),
          tags: (entity.get('tags') || []).map((tag) => new TagDto(tag.toObject())),
          title: entity.get('title'),
          summary: entity.get('summary'),
          content: entity.get('content'),
          lang: entity.get('lang'),
          isHidden: entity.get('isHidden'),
          coverMedia: new ImageDto(entity.get('cover').toObject()),
          status: entity.get('status'),
          createdAt: entity.get('createdAt'),
          updatedAt: entity.get('updatedAt'),
          publishedAt: entity.get('publishedAt'),
        },
      };

      this._kafkaService.emit(KAFKA_TOPIC.CONTENT.ARTICLE_CHANGED, {
        key: entity.getId(),
        value: new ArticleChangedMessagePayload(payload),
      });
    }
  }
}
