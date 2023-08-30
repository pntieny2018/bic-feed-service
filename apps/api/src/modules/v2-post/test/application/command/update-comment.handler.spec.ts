import { createMock } from '@golevelup/ts-jest';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { I18nContext } from 'nestjs-i18n';
import { v4 } from 'uuid';

import { InternalEventEmitterService } from '../../../../../app/custom/event-emitter';
import { CommentHasBeenUpdatedEvent } from '../../../../../events/comment';
import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
  UserApplicationService,
} from '../../../../v2-user/application';
import { ContentBinding } from '../../../application/binding/binding-post/content.binding';
import { CONTENT_BINDING_TOKEN } from '../../../application/binding/binding-post/content.interface';
import {
  UpdateCommentCommand,
  UpdateCommentCommandPayload,
  UpdateCommentHandler,
} from '../../../application/command/comment';
import { CommentDomainService } from '../../../domain/domain-service/comment.domain-service';
import {
  COMMENT_DOMAIN_SERVICE_TOKEN,
  ICommentDomainService,
} from '../../../domain/domain-service/interface';
import {
  CommentNotFoundException,
  ContentAccessDeniedException,
  ContentNoCommentPermissionException,
  ContentNotFoundException,
} from '../../../domain/exception';
import { PostEntity } from '../../../domain/model/content';
import {
  COMMENT_REPOSITORY_TOKEN,
  CONTENT_REPOSITORY_TOKEN,
  ICommentRepository,
  IContentRepository,
} from '../../../domain/repositoty-interface';
import { ContentValidator } from '../../../domain/validator/content.validator';
import { CONTENT_VALIDATOR_TOKEN } from '../../../domain/validator/interface';
import { CommentRepository } from '../../../driven-adapter/repository/comment.repository';
import { ContentRepository } from '../../../driven-adapter/repository/content.repository';
import { commentEntityMock } from '../../mock/comment.entity.mock';
import { postProps } from '../../mock/post.props.mock';
import { userMentions, userMock } from '../../mock/user.dto.mock';

describe('UpdateCommentHandler', () => {
  let handler: UpdateCommentHandler;
  let repo: IContentRepository;
  let domainService: ICommentDomainService;
  let eventEmitter: InternalEventEmitterService;
  let userApplicationService: IUserApplicationService;
  let commentRepo: ICommentRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateCommentHandler,
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

    handler = module.get<UpdateCommentHandler>(UpdateCommentHandler);
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
    it('Should update comment successfully', async () => {
      const payload: UpdateCommentCommandPayload = {
        media: {
          files: [],
          images: ['ea62f4f6-92a1-4c0b-9f4a-7680544e6a44'],
          videos: [],
        },
        id: commentEntityMock.get('id'),
        content: 'This is a comment',
        giphyId: 'EZICHGrSD5QEFCxMiC',
        mentions: userMentions.map((mention) => mention.id),
        actor: userMock,
      };
      const command = new UpdateCommentCommand(payload);
      const postEntity = new PostEntity({ ...postProps, id: commentEntityMock.get('postId') });
      const spyCommentRepo = jest
        .spyOn(commentRepo, 'findOne')
        .mockResolvedValue(commentEntityMock);
      const spyRepo = jest.spyOn(repo, 'findOne').mockResolvedValue(postEntity);
      const spyUserAppService = jest.spyOn(userApplicationService, 'findAllByIds').mockReturnThis();
      const spyDomainService = jest.spyOn(domainService, 'update').mockReturnThis();
      await handler.execute(command);
      expect(spyRepo).toBeCalledWith({
        where: { id: commentEntityMock.get('postId'), groupArchived: false, isHidden: false },
        include: {
          mustIncludeGroup: true,
        },
      });
      expect(spyCommentRepo).toBeCalledWith({ id: commentEntityMock.get('id') });
      expect(spyUserAppService).toBeCalledWith(payload.mentions, { withGroupJoined: true });
      expect(spyDomainService).toBeCalled();
      expect(eventEmitter.emit).toBeCalledWith(
        new CommentHasBeenUpdatedEvent({
          actor: payload.actor,
          oldMentions: commentEntityMock.get('mentions'),
          commentId: commentEntityMock.get('id'),
        })
      );
    });

    it('Should throw comment not found', async () => {
      const payload: UpdateCommentCommandPayload = {
        media: {
          files: [],
          images: ['ea62f4f6-92a1-4c0b-9f4a-7680544e6a44'],
          videos: [],
        },
        id: commentEntityMock.get('id'),
        content: 'This is a comment',
        giphyId: 'EZICHGrSD5QEFCxMiC',
        mentions: userMentions.map((mention) => mention.id),
        actor: userMock,
      };
      const command = new UpdateCommentCommand(payload);
      const spyCommentRepo = jest.spyOn(commentRepo, 'findOne').mockResolvedValue(null);
      try {
        await handler.execute(command);
      } catch (error) {
        expect(spyCommentRepo).toBeCalledWith({ id: commentEntityMock.get('id') });
        expect(error).toBeInstanceOf(CommentNotFoundException);
      }
    });

    it('Should throw content no CRUD permission', async () => {
      const payload: UpdateCommentCommandPayload = {
        media: {
          files: [],
          images: ['ea62f4f6-92a1-4c0b-9f4a-7680544e6a44'],
          videos: [],
        },
        id: commentEntityMock.get('id'),
        content: 'This is a comment',
        giphyId: 'EZICHGrSD5QEFCxMiC',
        mentions: userMentions.map((mention) => mention.id),
        actor: { ...userMock, id: v4() },
      };
      const command = new UpdateCommentCommand(payload);
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
      const payload: UpdateCommentCommandPayload = {
        media: {
          files: [],
          images: ['ea62f4f6-92a1-4c0b-9f4a-7680544e6a44'],
          videos: [],
        },
        id: commentEntityMock.get('id'),
        content: 'This is a comment',
        giphyId: 'EZICHGrSD5QEFCxMiC',
        mentions: userMentions.map((mention) => mention.id),
        actor: userMock,
      };
      const command = new UpdateCommentCommand(payload);
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

    it('Should throw exception do not allow comment', async () => {
      const payload: UpdateCommentCommandPayload = {
        media: {
          files: [],
          images: ['ea62f4f6-92a1-4c0b-9f4a-7680544e6a44'],
          videos: [],
        },
        id: commentEntityMock.get('id'),
        content: 'This is a comment',
        giphyId: 'EZICHGrSD5QEFCxMiC',
        mentions: userMentions.map((mention) => mention.id),
        actor: userMock,
      };
      const postEntity = new PostEntity({
        ...postProps,
        id: commentEntityMock.get('postId'),
        setting: {
          ...postProps.setting,
          canComment: false,
        },
      });
      const command = new UpdateCommentCommand(payload);
      const spyCommentRepo = jest
        .spyOn(commentRepo, 'findOne')
        .mockResolvedValue(commentEntityMock);
      const spyRepo = jest.spyOn(repo, 'findOne').mockResolvedValue(postEntity);
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
        expect(error).toBeInstanceOf(ContentNoCommentPermissionException);
      }
    });
  });
});
