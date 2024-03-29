import { Test } from '@nestjs/testing';
import { EventPublisher } from '@nestjs/cqrs';
import { createMock } from '@golevelup/ts-jest';
import { LinkPreviewFactory } from '../../../domain/factory/link-preview.factory';
import { mockLinkPreviewEntity, mockLinkPreviewRecord } from '../../mock/link-preview.entity.mock';
import { LinkPreviewEntity } from '../../../domain/model/link-preview';

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

  describe('createLinkPreview', () => {
    it('should return a link preview success', () => {
      const result = linkPreviewFactory.createLinkPreview({
        url: 'string',
        domain: 'string',
        image: 'string',
        title: 'string',
        description: 'string',
      });

      expect(result).toBeDefined();
      expect(eventPublisher.mergeObjectContext).toBeCalledWith(expect.any(LinkPreviewEntity));
    });
  });

  describe('reconstitute', () => {
    it('should return a LinkPreviewEntity success', () => {
      const result = linkPreviewFactory.reconstitute(mockLinkPreviewRecord);

      expect(result).toEqual(eventPublisher.mergeObjectContext(mockLinkPreviewEntity));
    });

    it('should throw an error if link preview id is not uuid', async () => {
      try {
        await linkPreviewFactory.reconstitute({
          id: 'not-uuid',
          ...mockLinkPreviewRecord,
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
