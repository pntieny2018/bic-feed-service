import { createMock } from '@golevelup/ts-jest';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { I18nContext } from 'nestjs-i18n';
import { NIL, v4 } from 'uuid';

import { InternalEventEmitterService } from '../../../../../app/custom/event-emitter';
import { CommentHasBeenCreatedEvent } from '../../../../../events/comment';
import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
  UserApplicationService,
} from '../../../../v2-user/application';
import { ContentBinding } from '../../../application/binding/binding-post/content.binding';
import { CONTENT_BINDING_TOKEN } from '../../../application/binding/binding-post/content.interface';
import {
  ReplyCommentCommand,
  ReplyCommentCommandPayload,
  ReplyCommentHandler,
} from '../../../application/command/comment';
import { CommentDomainService } from '../../../domain/domain-service/comment.domain-service';
import {
  COMMENT_DOMAIN_SERVICE_TOKEN,
  ICommentDomainService,
} from '../../../domain/domain-service/interface';
import {
  CommentReplyNotExistException,
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
import { createCommentDto } from '../../mock/comment.dto.mock';
import { createMockCommentEntity } from '../../mock/comment.mock';
import { postProps } from '../../mock/post.props.mock';
import { createMockUserDto } from '../../mock/user.mock';

const userMock = createMockUserDto();
const userMentions = [createMockUserDto()];

describe('ReplyCommentHandler', () => {
  let handler: ReplyCommentHandler;
  let repo: IContentRepository;
  let domainService: ICommentDomainService;
  let eventEmitter: InternalEventEmitterService;
  let userApplicationService: IUserApplicationService;
  let commentRepo: ICommentRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReplyCommentHandler,
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

    handler = module.get<ReplyCommentHandler>(ReplyCommentHandler);
    repo = module.get<ContentRepository>(CONTENT_REPOSITORY_TOKEN);
    domainService = module.get<CommentDomainService>(COMMENT_DOMAIN_SERVICE_TOKEN);
    userApplicationService = module.get<UserApplicationService>(USER_APPLICATION_TOKEN);
    eventEmitter = module.get<InternalEventEmitterService>(InternalEventEmitterService);
    commentRepo = module.get<CommentRepository>(COMMENT_REPOSITORY_TOKEN);

    jest.spyOn(I18nContext, 'current').mockImplementation(
      () =>
        ({
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          t: () => {},
        } as any)
    );

    jest.spyOn(eventEmitter, 'emit').mockImplementation(() => ({
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      t: () => {},
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('Should reply comment successfully', async () => {
      const parentId = v4();
      const postId = v4();
      const payload: ReplyCommentCommandPayload = {
        media: {
          files: [],
          images: ['ea62f4f6-92a1-4c0b-9f4a-7680544e6a44'],
          videos: [],
        },
        parentId: parentId,
        contentId: postId,
        content: 'This is a sample comment',
        giphyId: 'EZICHGrSD5QEFCxMiC',
        mentions: userMentions.map((mention) => mention.id),
        actor: userMock,
      };
      const command = new ReplyCommentCommand(payload);
      const parentCommentEntity = createMockCommentEntity({ ...payload, postId });
      const commentEntity = createMockCommentEntity({ ...payload, postId, parentId });
      const commentDto = createCommentDto(commentEntity);
      const postEntity = new PostEntity({ ...postProps, id: postId });

      jest.spyOn(commentRepo, 'findOne').mockResolvedValue(parentCommentEntity);
      commentRepo.findOne = jest.fn().mockResolvedValue(Promise.resolve());
      jest.spyOn(repo, 'findOne').mockResolvedValue(postEntity);
      repo.findOne = jest.fn().mockResolvedValue(Promise.resolve());
      jest.spyOn(domainService, 'create').mockResolvedValue(commentEntity);
      const result = await handler.execute(command);
      expect(commentRepo.findOne).toBeCalledWith({
        id: parentId,
        parentId: NIL,
      });
      expect(repo.findOne).toBeCalledWith({
        where: { id: postId, groupArchived: false, isHidden: false },
        include: {
          mustIncludeGroup: true,
        },
      });
      expect(eventEmitter.emit).toBeCalledWith(
        new CommentHasBeenCreatedEvent({
          actor: payload.actor,
          commentId: commentEntity.get('id'),
        })
      );
      expect(result).toEqual(commentDto);
    });

    it('Should throw error when content not found', async () => {
      const parentTagetId = v4();
      const postId = v4();
      const payload: ReplyCommentCommandPayload = {
        media: {
          files: [],
          images: [],
          videos: [],
        },
        parentId: parentTagetId,
        contentId: postId,
        content: 'This is a comment',
        giphyId: 'EZICHGrSD5QEFCxMiC',
        mentions: [],
        actor: userMock,
      };
      const parentCommentEntity = createMockCommentEntity({ ...payload, postId });
      const command = new ReplyCommentCommand(payload);

      const spyCommentRepo = jest
        .spyOn(commentRepo, 'findOne')
        .mockResolvedValue(parentCommentEntity);
      const spyRepo = jest.spyOn(repo, 'findOne').mockResolvedValue(null);
      await expect(handler.execute(command)).rejects.toThrowError(ContentNotFoundException);
      expect(spyRepo).toBeCalled();
      expect(spyCommentRepo).toBeCalledWith({
        id: parentTagetId,
        parentId: NIL,
      });
    });
  });

  it('Should throw error when content do not allow comment', async () => {
    const parentTagetId = v4();
    const postId = v4();
    const payload: ReplyCommentCommandPayload = {
      media: {
        files: [],
        images: [],
        videos: [],
      },
      parentId: parentTagetId,
      contentId: postId,
      content: 'This is a comment',
      giphyId: 'EZICHGrSD5QEFCxMiC',
      mentions: [],
      actor: userMock,
    };
    const command = new ReplyCommentCommand(payload);
    const parentCommentEntity = createMockCommentEntity({ ...payload, postId });
    const postEntity = new PostEntity({
      ...postProps,
      id: postId,
      setting: { ...postProps.setting, canComment: false },
    });

    const spyCommentRepo = jest
      .spyOn(commentRepo, 'findOne')
      .mockResolvedValue(parentCommentEntity);
    const spyRepo = jest.spyOn(repo, 'findOne').mockResolvedValue(postEntity);
    await expect(handler.execute(command)).rejects.toThrowError(
      ContentNoCommentPermissionException
    );
    expect(spyCommentRepo).toBeCalledWith({
      id: parentTagetId,
      parentId: NIL,
    });
    expect(spyRepo).toBeCalled();
  });

  it('Should throw error when not found parent comment', async () => {
    const parentTagetId = v4();
    const postId = v4();
    const payload: ReplyCommentCommandPayload = {
      media: {
        files: [],
        images: [],
        videos: [],
      },
      parentId: parentTagetId,
      contentId: postId,
      content: 'This is a comment',
      giphyId: 'EZICHGrSD5QEFCxMiC',
      mentions: [],
      actor: userMock,
    };
    const command = new ReplyCommentCommand(payload);

    jest.spyOn(commentRepo, 'findOne').mockResolvedValue(null);
    await expect(handler.execute(command)).rejects.toThrowError(CommentReplyNotExistException);
  });
});
