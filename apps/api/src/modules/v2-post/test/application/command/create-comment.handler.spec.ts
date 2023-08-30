import { createMock } from '@golevelup/ts-jest';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { I18nContext } from 'nestjs-i18n';
import { v4 } from 'uuid';

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
  CreateCommentCommand,
  CreateCommentCommandPayload,
  CreateCommentHandler,
} from '../../../application/command/comment';
import { CommentDomainService } from '../../../domain/domain-service/comment.domain-service';
import {
  COMMENT_DOMAIN_SERVICE_TOKEN,
  ICommentDomainService,
} from '../../../domain/domain-service/interface';
import {
  ContentNoCommentPermissionException,
  ContentNotFoundException,
} from '../../../domain/exception';
import { PostEntity } from '../../../domain/model/content';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import { ContentValidator } from '../../../domain/validator/content.validator';
import { CONTENT_VALIDATOR_TOKEN } from '../../../domain/validator/interface';
import { ContentRepository } from '../../../driven-adapter/repository/content.repository';
import { createCommentDto } from '../../mock/comment.dto.mock';
import { createCommentEntity } from '../../mock/comment.entity.mock';
import { postProps } from '../../mock/post.props.mock';
import { userMentions, userMock } from '../../mock/user.dto.mock';

describe('CreateCommentHandler', () => {
  let handler: CreateCommentHandler;
  let repo: IContentRepository;
  let domainService: ICommentDomainService;
  let eventEmitter: InternalEventEmitterService;
  let userApplicationService: IUserApplicationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCommentHandler,
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
      ],
    }).compile();

    handler = module.get<CreateCommentHandler>(CreateCommentHandler);
    repo = module.get<ContentRepository>(CONTENT_REPOSITORY_TOKEN);
    domainService = module.get<CommentDomainService>(COMMENT_DOMAIN_SERVICE_TOKEN);
    userApplicationService = module.get<UserApplicationService>(USER_APPLICATION_TOKEN);
    eventEmitter = module.get<InternalEventEmitterService>(InternalEventEmitterService);

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
    it('Should create comment successfully', async () => {
      const postId = v4();
      const payload: CreateCommentCommandPayload = {
        media: {
          files: [],
          images: ['ea62f4f6-92a1-4c0b-9f4a-7680544e6a44'],
          videos: [],
        },
        postId: postId,
        content: 'This is a comment',
        giphyId: 'EZICHGrSD5QEFCxMiC',
        mentions: userMentions.map((mention) => mention.id),
        actor: userMock,
      };
      const command = new CreateCommentCommand(payload);
      const commentEntity = createCommentEntity(payload, postId);
      const commentDto = createCommentDto(commentEntity);
      const postEntity = new PostEntity({ ...postProps, id: postId });

      const spyRepo = jest.spyOn(repo, 'findOne').mockResolvedValue(postEntity);
      const spyDomainService = jest.spyOn(domainService, 'create').mockResolvedValue(commentEntity);
      const result = await handler.execute(command);
      expect(repo.findOne).toBeCalledWith({
        where: { id: postId, groupArchived: false, isHidden: false },
        include: {
          mustIncludeGroup: true,
        },
      });
      expect(spyRepo).toBeCalled();
      expect(spyDomainService).toBeCalled();
      expect(eventEmitter.emit).toBeCalledWith(
        new CommentHasBeenCreatedEvent({
          actor: payload.actor,
          commentId: commentEntity.get('id'),
        })
      );
      expect(result).toEqual(commentDto);
    });

    it('Should throw error when content not found', async () => {
      const postId = v4();
      const payload: CreateCommentCommandPayload = {
        media: {
          files: [],
          images: [],
          videos: [],
        },
        postId: postId,
        content: 'This is a comment',
        giphyId: 'EZICHGrSD5QEFCxMiC',
        mentions: [],
        actor: userMock,
      };
      const command = new CreateCommentCommand(payload);
      jest.spyOn(repo, 'findOne').mockResolvedValue(null);
      await expect(handler.execute(command)).rejects.toThrowError(ContentNotFoundException);
    });
  });

  it('Should throw error when content do not allow comment', async () => {
    const postId = v4();
    const payload: CreateCommentCommandPayload = {
      media: {
        files: [],
        images: [],
        videos: [],
      },
      postId: postId,
      content: 'This is a comment',
      giphyId: 'EZICHGrSD5QEFCxMiC',
      mentions: [],
      actor: userMock,
    };
    const command = new CreateCommentCommand(payload);

    const postEntity = new PostEntity({
      ...postProps,
      id: postId,
      setting: { ...postProps.setting, canComment: false },
    });
    jest.spyOn(repo, 'findOne').mockResolvedValue(postEntity);
    await expect(handler.execute(command)).rejects.toThrowError(
      ContentNoCommentPermissionException
    );
  });
});
