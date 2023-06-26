import { cloneDeep } from 'lodash';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateArticleCommand } from './update-article.command';
import { ArticleRequiredCoverException, ContentNotFoundException } from '../../../domain/exception';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import { ArticleEntity } from '../../../domain/model/content';
import { CONTENT_VALIDATOR_TOKEN, IContentValidator } from '../../../domain/validator/interface';
import {
  ARTICLE_DOMAIN_SERVICE_TOKEN,
  IArticleDomainService,
} from '../../../domain/domain-service/interface';
import { UserDto } from '../../../../v2-user/application';
import { ArticleChangedMessagePayload } from '../../dto/message';
import { KAFKA_TOPIC, KafkaService } from '@app/kafka';
import { ImageDto, TagDto } from '../../dto';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../v2-group/application';

@CommandHandler(UpdateArticleCommand)
export class UpdateArticleHandler implements ICommandHandler<UpdateArticleCommand, void> {
  public constructor(
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator,
    @Inject(ARTICLE_DOMAIN_SERVICE_TOKEN)
    private readonly _articleDomainService: IArticleDomainService,
    @Inject(GROUP_APPLICATION_TOKEN)
    protected _groupAppService: IGroupApplicationService,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    private readonly _kafkaService: KafkaService
  ) {}

  public async execute(command: UpdateArticleCommand): Promise<void> {
    const { actor, id, coverMedia } = command.payload;

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

    if (coverMedia && !coverMedia.id) throw new ArticleRequiredCoverException();

    const articleEntityBefore = cloneDeep(articleEntity);

    await this._articleDomainService.update({
      articleEntity,
      newData: command.payload,
    });

    this._sendEvent(articleEntityBefore, articleEntity, actor);
  }

  private _sendEvent(
    entityBefore: ArticleEntity,
    entityAfter: ArticleEntity,
    actor: UserDto
  ): void {
    if (entityAfter.isPublished()) {
      const payload: ArticleChangedMessagePayload = {
        state: 'update',
        before: {
          id: entityBefore.get('id'),
          actor,
          type: entityBefore.get('type'),
          setting: entityBefore.get('setting'),
          groupIds: entityBefore.get('groupIds'),
          seriesIds: entityBefore.get('seriesIds'),
          tags: (entityBefore.get('tags') || []).map((tag) => new TagDto(tag.toObject())),
          title: entityBefore.get('title'),
          summary: entityBefore.get('summary'),
          content: entityBefore.get('content'),
          lang: entityBefore.get('lang'),
          isHidden: entityBefore.get('isHidden'),
          status: entityBefore.get('status'),
          createdAt: entityBefore.get('createdAt'),
          updatedAt: entityBefore.get('updatedAt'),
          publishedAt: entityBefore.get('publishedAt'),
        },
        after: {
          id: entityAfter.get('id'),
          actor,
          type: entityAfter.get('type'),
          setting: entityAfter.get('setting'),
          groupIds: entityAfter.get('groupIds'),
          communityIds: entityAfter.get('communityIds'),
          seriesIds: entityAfter.get('seriesIds'),
          tags: (entityAfter.get('tags') || []).map((tag) => new TagDto(tag.toObject())),
          title: entityAfter.get('title'),
          summary: entityAfter.get('summary'),
          content: entityAfter.get('content'),
          lang: entityAfter.get('lang'),
          state: {
            attachGroupIds: entityAfter.getState().attachGroupIds,
            detachGroupIds: entityAfter.getState().detachGroupIds,
            attachTagIds: entityAfter.getState().attachTagIds,
            detachTagIds: entityAfter.getState().detachTagIds,
            attachSeriesIds: entityAfter.getState().attachSeriesIds,
            detachSeriesIds: entityAfter.getState().detachSeriesIds,
          },
          isHidden: entityAfter.get('isHidden'),
          coverMedia: new ImageDto(entityAfter.get('cover').toObject()),
          status: entityAfter.get('status'),
          createdAt: entityAfter.get('createdAt'),
          updatedAt: entityAfter.get('updatedAt'),
          publishedAt: entityAfter.get('publishedAt'),
        },
      };

      this._kafkaService.emit(KAFKA_TOPIC.CONTENT.ARTICLE_CHANGED, {
        key: entityAfter.getId(),
        value: new ArticleChangedMessagePayload(payload),
      });
    }
  }
}
