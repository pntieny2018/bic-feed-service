import { CommentFactory } from '../../../domain/factory';
import { Test } from '@nestjs/testing';
import { commentRecord } from '../../mock/comment.model.mock';
import { EventPublisher } from '@nestjs/cqrs';
import { createMock } from '@golevelup/ts-jest';
import { CommentEntity } from '../../../domain/model/comment';

describe('CommentFactory', function () {
  let commentFactory: CommentFactory;
  let eventPublisher: EventPublisher;

  beforeEach(async function () {
    const module = await Test.createTestingModule({
      providers: [
        CommentFactory,
        {
          provide: EventPublisher,
          useValue: createMock<EventPublisher>(),
        },
      ],
    }).compile();

    commentFactory = module.get<CommentFactory>(CommentFactory);
    eventPublisher = module.get<EventPublisher>(EventPublisher);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createComment', () => {
    it('should return a CommentEntity success', () => {
      const result = commentFactory.createComment({
        userId: commentRecord.createdBy,
        postId: commentRecord.postId,
        content: commentRecord.content,
      });

      expect(result).toBeDefined();
      expect(eventPublisher.mergeObjectContext).toBeCalledWith(expect.any(CommentEntity));
    });
  });

  describe('reconstitute', () => {
    it('should return a CommentEntity success', () => {
      const result = commentFactory.reconstitute({
        id: commentRecord.id,
        postId: commentRecord.postId,
        createdBy: commentRecord.createdBy,
        updatedBy: commentRecord.updatedBy,
      });

      expect(result).toBeDefined();
      expect(eventPublisher.mergeObjectContext).toBeCalledWith(expect.any(CommentEntity));
    });

    it('should throw an error if comment id is not uuid', async () => {
      try {
        await commentFactory.reconstitute({
          id: 'not-uuid',
          postId: commentRecord.postId,
          createdBy: commentRecord.createdBy,
          updatedBy: commentRecord.updatedBy,
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
