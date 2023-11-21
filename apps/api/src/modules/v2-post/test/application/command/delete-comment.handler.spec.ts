/* eslint-disable @typescript-eslint/unbound-method */
import { TestBed } from '@automock/jest';
import { v4 } from 'uuid';

import {
  DeleteCommentCommand,
  DeleteCommentCommandPayload,
  DeleteCommentHandler,
} from '../../../application/command/comment';
import {
  COMMENT_DOMAIN_SERVICE_TOKEN,
  CONTENT_DOMAIN_SERVICE_TOKEN,
  ICommentDomainService,
  IContentDomainService,
} from '../../../domain/domain-service/interface';
import {
  ContentAccessDeniedException,
  ContentNoCRUDPermissionException,
} from '../../../domain/exception';
import { CONTENT_VALIDATOR_TOKEN, IContentValidator } from '../../../domain/validator/interface';
import {
  MockClass,
  createMockCommentEntity,
  createMockPostEntity,
  createMockUserDto,
} from '../../mock';

describe('DeleteCommentHandler', () => {
  let handler: DeleteCommentHandler;
  let commentDomain: MockClass<ICommentDomainService>;
  let contentDomain: MockClass<IContentDomainService>;
  let contentValidator: MockClass<IContentValidator>;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(DeleteCommentHandler).compile();

    handler = unit;
    commentDomain = unitRef.get(COMMENT_DOMAIN_SERVICE_TOKEN);
    contentDomain = unitRef.get(CONTENT_DOMAIN_SERVICE_TOKEN);
    contentValidator = unitRef.get(CONTENT_VALIDATOR_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockActor = createMockUserDto();
    const mockCommentId = v4();

    const mockPayload: DeleteCommentCommandPayload = {
      commentId: mockCommentId,
      actor: mockActor,
    };
    const mockCommand = new DeleteCommentCommand(mockPayload);

    it('Should delete comment successfully', async () => {
      const mockCommentEntity = createMockCommentEntity({
        id: mockCommentId,
        createdBy: mockActor.id,
      });
      const mockContentEntity = createMockPostEntity({ id: mockCommentEntity.get('postId') });

      commentDomain.getVisibleComment.mockResolvedValue(mockCommentEntity);
      contentDomain.getVisibleContent.mockResolvedValue(mockContentEntity);

      await handler.execute(mockCommand);

      expect(commentDomain.getVisibleComment).toBeCalledWith(mockCommentId);
      expect(contentDomain.getVisibleContent).toBeCalledWith(mockCommentEntity.get('postId'));
      expect(contentValidator.checkCanReadContent).toBeCalledWith(mockContentEntity, mockActor);
      expect(commentDomain.delete).toBeCalledWith(mockCommentEntity, mockActor);
    });

    it('Should throw access denined', async () => {
      const mockCommentEntity = createMockCommentEntity({ id: mockCommentId });

      commentDomain.getVisibleComment.mockResolvedValue(mockCommentEntity);

      try {
        await handler.execute(mockCommand);
      } catch (error) {
        expect(error).toBeInstanceOf(ContentAccessDeniedException);
        expect(commentDomain.getVisibleComment).toBeCalledWith(mockCommentId);
        expect(contentDomain.getVisibleContent).not.toBeCalled();
        expect(contentValidator.checkCanReadContent).not.toBeCalled();
        expect(commentDomain.delete).not.toBeCalled();
      }
    });

    it('Should throw content no CRUD permission', async () => {
      const mockCommentEntity = createMockCommentEntity({
        id: mockCommentId,
        createdBy: mockActor.id,
      });
      const mockContentEntity = createMockPostEntity({ id: mockCommentEntity.get('postId') });

      commentDomain.getVisibleComment.mockResolvedValue(mockCommentEntity);
      contentDomain.getVisibleContent.mockResolvedValue(mockContentEntity);
      contentValidator.checkCanReadContent.mockRejectedValue(
        new ContentNoCRUDPermissionException()
      );

      try {
        await handler.execute(mockCommand);
      } catch (error) {
        expect(error).toBeInstanceOf(ContentNoCRUDPermissionException);
        expect(commentDomain.getVisibleComment).toBeCalledWith(mockCommentId);
        expect(contentDomain.getVisibleContent).toBeCalledWith(mockCommentEntity.get('postId'));
        expect(contentValidator.checkCanReadContent).toBeCalledWith(mockContentEntity, mockActor);
        expect(commentDomain.delete).not.toBeCalled();
      }
    });
  });
});
