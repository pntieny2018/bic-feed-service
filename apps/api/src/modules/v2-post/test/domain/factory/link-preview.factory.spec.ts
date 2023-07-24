import { Test } from '@nestjs/testing';
import { commentRecord } from '../../mock/comment.model.mock';
import { EventPublisher } from '@nestjs/cqrs';
import { createMock } from '@golevelup/ts-jest';
import { LinkPreviewFactory } from '../../../domain/factory/link-preview.factory';
import { mockLinkPreviewEntity, mockLinkPreviewRecord } from '../../mock/link-preview.entity.mock';

describe('LinkPreviewFactory', function () {
  let linkPreviewFactory: LinkPreviewFactory;
  let eventPublisher: EventPublisher;

  beforeEach(async function () {
    const module = await Test.createTestingModule({
      providers: [
        LinkPreviewFactory,
        {
          provide: EventPublisher,
          useValue: createMock<EventPublisher>(),
        },
      ],
    }).compile();

    linkPreviewFactory = module.get<LinkPreviewFactory>(LinkPreviewFactory);
    eventPublisher = module.get<EventPublisher>(EventPublisher);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createComment', () => {
    it('should return a CommentEntity success', () => {
      const result = linkPreviewFactory.createLinkPreview({
        url: 'string',
        domain: 'string',
        image: 'string',
        title: 'string',
        description: 'string',
      });

      expect(result).toBeDefined();
    });
  });

  describe('reconstitute', () => {
    it('should return a CommentEntity success', () => {
      const result = linkPreviewFactory.reconstitute(mockLinkPreviewRecord);

      expect(result).toEqual(eventPublisher.mergeObjectContext(mockLinkPreviewEntity));
    });
  });
});
