import { KAFKA_TOPIC, KafkaService } from '@app/kafka';
import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';

import { TagDto } from '../../../../application/dto';
import { ArticleChangedMessagePayload } from '../../../../application/dto/message';
import { ArticleDeletedEventHandler } from '../../../../application/event-handler/article';
import { ArticleDeletedEvent } from '../../../../domain/event';
import { createMockArticleEntity } from '../../../mock/content.mock';
import { createMockUserDto } from '../../../mock/user.mock';

const articleEntityMock = createMockArticleEntity();
const userMock = createMockUserDto();

describe('ArticleDeletedEventHandler', () => {
  let eventHandler: ArticleDeletedEventHandler;
  let kafkaService: KafkaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleDeletedEventHandler,
        {
          provide: KafkaService,
          useValue: createMock<KafkaService>(),
        },
      ],
    }).compile();

    eventHandler = module.get(ArticleDeletedEventHandler);
    kafkaService = module.get(KafkaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handle', () => {
    it('should emit kafka message successfully', async () => {
      jest.spyOn(articleEntityMock, 'isPublished').mockReturnValue(true);
      eventHandler.handle(new ArticleDeletedEvent(articleEntityMock, userMock));

      expect(kafkaService.emit).toBeCalledWith(KAFKA_TOPIC.CONTENT.ARTICLE_CHANGED, {
        key: articleEntityMock.getId(),
        value: new ArticleChangedMessagePayload({
          state: 'delete',
          before: {
            id: articleEntityMock.get('id'),
            actor: userMock,
            type: articleEntityMock.get('type'),
            setting: articleEntityMock.get('setting'),
            groupIds: articleEntityMock.get('groupIds'),
            seriesIds: articleEntityMock.get('seriesIds'),
            tags: (articleEntityMock.get('tags') || []).map((tag) => new TagDto(tag.toObject())),
            title: articleEntityMock.get('title'),
            summary: articleEntityMock.get('summary'),
            content: articleEntityMock.get('content'),
            lang: articleEntityMock.get('lang'),
            isHidden: articleEntityMock.get('isHidden'),
            status: articleEntityMock.get('status'),
            createdAt: articleEntityMock.get('createdAt'),
            updatedAt: articleEntityMock.get('updatedAt'),
            publishedAt: articleEntityMock.get('publishedAt'),
          },
        }),
      });
    });

    it('should not emit kafka message when article is not published', async () => {
      jest.spyOn(articleEntityMock, 'isPublished').mockReturnValue(false);
      eventHandler.handle(new ArticleDeletedEvent(articleEntityMock, userMock));

      expect(kafkaService.emit).not.toBeCalled();
    });
  });
});
