import { Test } from '@nestjs/testing';
import { EventPublisher } from '@nestjs/cqrs';
import { createMock } from '@golevelup/ts-jest';
import { ITagFactory } from '../../../domain/factory/interface';
import { TagFactory } from '../../../domain/factory';
import { mockTagEntity, mockTagRecord } from '../../mock/tag.entity.mock';
import { TagEntity } from '../../../domain/model/tag';

describe('TagFactory', function () {
  let tagFactory: ITagFactory;
  let eventPublisher: EventPublisher;

  beforeEach(async function () {
    const module = await Test.createTestingModule({
      providers: [
        TagFactory,
        {
          provide: EventPublisher,
          useValue: createMock<EventPublisher>(),
        },
      ],
    }).compile();

    tagFactory = module.get<ITagFactory>(TagFactory);
    eventPublisher = module.get<EventPublisher>(EventPublisher);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should return a TagEntity success', () => {
      const result = tagFactory.create({
        name: 'string',
        groupId: '7b63852c-5249-499a-a32b-6bdaa2761fc1',
        userId: '7b63852c-5249-499a-a32b-6bdaa2761fc1',
      });

      expect(result).toBeDefined();
      expect(eventPublisher.mergeObjectContext).toBeCalledWith(expect.any(TagEntity));
    });
  });

  describe('reconstitute', () => {
    it('should return a TagEntity success', () => {
      const result = tagFactory.reconstitute(mockTagRecord);

      expect(result).toEqual(mockTagEntity);
    });
  });
});
