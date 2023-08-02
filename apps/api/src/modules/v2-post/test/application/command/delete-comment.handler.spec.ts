import { Test, TestingModule } from '@nestjs/testing';
import { I18nContext } from 'nestjs-i18n';
import { CONTENT_VALIDATOR_TOKEN } from '../../../domain/validator/interface';
import {
  COMMENT_DOMAIN_SERVICE_TOKEN,
  ICommentDomainService,
} from '../../../domain/domain-service/interface';
import { createMock } from '@golevelup/ts-jest';
import { ContentValidator } from '../../../domain/validator/content.validator';
import { CommentDomainService } from '../../../domain/domain-service/comment.domain-service';
import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
  UserApplicationService,
} from '../../../../v2-user/application';
import { CONTENT_BINDING_TOKEN } from '../../../application/binding/binding-post/content.interface';
import { ContentBinding } from '../../../application/binding/binding-post/content.binding';
import { PostEntity } from '../../../domain/model/content';
import { postProps } from '../../mock/post.props.mock';
import { InternalEventEmitterService } from '../../../../../app/custom/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CommentHasBeenDeletedEvent } from '../../../../../events/comment';
import { userMock } from '../../mock/user.dto.mock';
import { ContentRepository } from '../../../driven-adapter/repository/content.repository';
import {
  COMMENT_REPOSITORY_TOKEN,
  CONTENT_REPOSITORY_TOKEN,
  ICommentRepository,
  IContentRepository,
} from '../../../domain/repositoty-interface';
import { commentEntityMock } from '../../mock/comment.entity.mock';
import { CommentRepository } from '../../../driven-adapter/repository/comment.repository';
import { DeleteCommentHandler } from '../../../application/command/delete-comment/delete-comment.handler';
import {
  DeleteCommentCommand,
  DeleteCommentCommandPayload,
} from '../../../application/command/delete-comment/delete-comment.command';
import {
  CommentNotFoundException,
  ContentAccessDeniedException,
  ContentNoCRUDPermissionException,
  ContentNotFoundException,
} from '../../../domain/exception';
import { v4 } from 'uuid';

describe('DeleteCommentHandler', () => {
  let handler: DeleteCommentHandler;
  let repo: IContentRepository;
  let domainService: ICommentDomainService;
  let eventEmitter: InternalEventEmitterService;
  let userApplicationService: IUserApplicationService;
  let commentRepo: ICommentRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteCommentHandler,
        EventEmitter2,
        InternalEventEmitterService,
        {
          provide: CONTENT_REPOSITORY_TOKEN,
          useValue: createMock<ContentRepository>(),
        },
        {
          provide: CONTENT_VALIDATOR_TOKEN,
          useValue: createMock<ContentValidator>(),
        },
        {
          provide: COMMENT_DOMAIN_SERVICE_TOKEN,
          useValue: createMock<CommentDomainService>(),
        },
        {
          provide: USER_APPLICATION_TOKEN,
          useValue: createMock<UserApplicationService>(),
        },
        {
          provide: CONTENT_BINDING_TOKEN,
          useValue: createMock<ContentBinding>(),
        },
        {
          provide: COMMENT_REPOSITORY_TOKEN,
          useValue: createMock<CommentRepository>(),
        },
      ],
    }).compile();

    handler = module.get<DeleteCommentHandler>(DeleteCommentHandler);
    repo = module.get<ContentRepository>(CONTENT_REPOSITORY_TOKEN);
    domainService = module.get<CommentDomainService>(COMMENT_DOMAIN_SERVICE_TOKEN);
    userApplicationService = module.get<UserApplicationService>(USER_APPLICATION_TOKEN);
    eventEmitter = module.get<InternalEventEmitterService>(InternalEventEmitterService);
    commentRepo = module.get<CommentRepository>(COMMENT_REPOSITORY_TOKEN);

    jest.spyOn(I18nContext, 'current').mockImplementation(
      () =>
        ({
          t: () => {},
        } as any)
    );

    jest.spyOn(eventEmitter, 'emit').mockImplementation(() => ({
      t: () => {},
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('Should delete comment successfully', async () => {
      const payload: DeleteCommentCommandPayload = {
        id: commentEntityMock.get('id'),
        actor: userMock,
      };
      const command = new DeleteCommentCommand(payload);
      const postEntity = new PostEntity({ ...postProps, id: commentEntityMock.get('postId') });
      const spyCommentRepo = jest
        .spyOn(commentRepo, 'findOne')
        .mockResolvedValue(commentEntityMock);
      const spyDeleteComment = jest.spyOn(commentRepo, 'destroyComment').mockReturnThis();
      const spyRepo = jest.spyOn(repo, 'findOne').mockResolvedValue(postEntity);
      await handler.execute(command);
      expect(spyRepo).toBeCalledWith({
        where: { id: commentEntityMock.get('postId'), groupArchived: false, isHidden: false },
        include: {
          mustIncludeGroup: true,
        },
      });
      expect(spyCommentRepo).toBeCalledWith({ id: commentEntityMock.get('id') });
      expect(spyDeleteComment).toBeCalledWith(commentEntityMock.get('id'));
      expect(eventEmitter.emit).toBeCalledWith(
        new CommentHasBeenDeletedEvent({
          actor: payload.actor,
          comment: commentEntityMock,
        })
      );
    });

    it('Should throw comment not found', async () => {
      const payload: DeleteCommentCommandPayload = {
        id: commentEntityMock.get('id'),
        actor: userMock,
      };
      const command = new DeleteCommentCommand(payload);
      const spyCommentRepo = jest.spyOn(commentRepo, 'findOne').mockResolvedValue(null);
      try {
        await handler.execute(command);
      } catch (error) {
        expect(spyCommentRepo).toBeCalledWith({ id: commentEntityMock.get('id') });
        expect(error).toBeInstanceOf(CommentNotFoundException);
      }
    });

    it('Should throw content no CRUD permission', async () => {
      const payload: DeleteCommentCommandPayload = {
        id: commentEntityMock.get('id'),
        actor: { ...userMock, id: v4() },
      };
      const command = new DeleteCommentCommand(payload);
      const spyCommentRepo = jest
        .spyOn(commentRepo, 'findOne')
        .mockResolvedValue(commentEntityMock);
      try {
        await handler.execute(command);
      } catch (error) {
        expect(spyCommentRepo).toBeCalledWith({ id: commentEntityMock.get('id') });
        expect(error).toBeInstanceOf(ContentAccessDeniedException);
      }
    });

    it('Should throw exception not found content', async () => {
      const payload: DeleteCommentCommandPayload = {
        id: commentEntityMock.get('id'),
        actor: userMock,
      };
      const command = new DeleteCommentCommand(payload);
      const spyCommentRepo = jest
        .spyOn(commentRepo, 'findOne')
        .mockResolvedValue(commentEntityMock);
      const spyRepo = jest.spyOn(repo, 'findOne').mockResolvedValue(null);
      try {
        await handler.execute(command);
      } catch (error) {
        expect(spyRepo).toBeCalledWith({
          where: { id: commentEntityMock.get('postId'), groupArchived: false, isHidden: false },
          include: {
            mustIncludeGroup: true,
          },
        });
        expect(spyCommentRepo).toBeCalledWith({ id: commentEntityMock.get('id') });
        expect(error).toBeInstanceOf(ContentNotFoundException);
      }
    });
  });
});
