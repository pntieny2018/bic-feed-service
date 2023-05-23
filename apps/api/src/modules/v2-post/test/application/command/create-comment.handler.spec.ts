import { Test, TestingModule } from '@nestjs/testing';
import { NIL, v4 } from 'uuid';
import { I18nContext } from 'nestjs-i18n';
import { CreateCommentHandler } from '../../../application/command/create-comment/create-comment.handler';
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
  UserDto,
} from '../../../../v2-user/application';
import { CONTENT_BINDING_TOKEN } from '../../../application/binding/binding-post/content.interface';
import { ContentBinding } from '../../../application/binding/binding-post/content.binding';
import { PostEntity } from '../../../domain/model/content';
import { postProps } from '../../mock/comment.mock';
import {
  CreateCommentCommand,
  CreateCommentCommandPayload,
} from '../../../application/command/create-comment/create-comment.command';
import { CommentEntity } from '../../../domain/model/comment';
import { CreateCommentDto } from '../../../application/command/create-comment/create-comment.dto';
import { createUrlFromId } from '../../../../v2-giphy/giphy.util';
import { FileDto, ImageDto, VideoDto } from '../../../application/dto';
import { InternalEventEmitterService } from '../../../../../app/custom/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CommentHasBeenCreatedEvent } from '../../../../../events/comment';
import {
  ContentNoCommentPermissionException,
  ContentNotFoundException,
} from '../../../domain/exception';
import { userMentions } from '../../mock/user.dto.mock';
import { ImageEntity } from '../../../domain/model/media';
import { ImageResource } from '../../../data-type';
import { ContentRepository } from '../../../driven-adapter/repository/content.repository';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';

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
      const targetId = v4();
      const payload: CreateCommentCommandPayload = {
        media: {
          files: [],
          images: ['ea62f4f6-92a1-4c0b-9f4a-7680544e6a44'],
          videos: [],
        },
        postId: targetId,
        content: 'This is a comment',
        giphyId: 'EZICHGrSD5QEFCxMiC',
        mentions: [],
        actor: {
          fullname: 'Admin EVOL',
          id: '001072e1-d214-4d3d-beab-8a5bb8784cc4',
          username: 'admin',
          email: 'admin@tgm.vn',
          avatar: '',
        },
      };
      const command = new CreateCommentCommand(payload);
      const commentEntity = new CommentEntity({
        id: v4(),
        postId: targetId,
        parentId: NIL,
        content: payload.content,
        giphyId: payload.giphyId,
        media: {
          files: [],
          images: [
            {
              id: v4(),
              src: '/image/variants/comment/content/ea62f4f6-92a1-4c0b-9f4a-7680544e6a44',
              url: 'https://media.beincom.io/image/variants/comment/content/ea62f4f6-92a1-4c0b-9f4a-7680544e6a44',
              width: 1000,
              height: 667,
              status: 'DONE',
              mimeType: 'image/jpeg',
              resource: ImageResource.COMMENT_CONTENT,
              createdBy: '001072e1-d214-4d3d-beab-8a5bb8784cc4',
            },
          ].map((item) => new ImageEntity(item)),
          videos: [],
        },
        mentions: payload.mentions || [],
        createdBy: payload.actor.id,
        updatedBy: payload.actor.id,
      });

      const commentDto = new CreateCommentDto({
        id: commentEntity.get('id'),
        edited: commentEntity.get('edited'),
        parentId: commentEntity.get('parentId'),
        postId: commentEntity.get('postId'),
        totalReply: commentEntity.get('totalReply'),
        content: commentEntity.get('content'),
        giphyId: commentEntity.get('giphyId'),
        giphyUrl: createUrlFromId(commentEntity.get('giphyId')),
        createdAt: commentEntity.get('createdAt'),
        createdBy: commentEntity.get('createdBy'),
        media: {
          files: commentEntity.get('media').files.map((item) => new FileDto(item.toObject())),
          images: commentEntity.get('media').images.map((item) => new ImageDto(item.toObject())),
          videos: commentEntity.get('media').videos.map((item) => new VideoDto(item.toObject())),
        },
        mentions: {},
        actor: new UserDto(payload.actor),
      });
      const postEntity = new PostEntity({ ...postProps, id: targetId });
      jest.spyOn(repo, 'findOne').mockResolvedValue(postEntity);
      repo.findOne = jest.fn().mockResolvedValue(Promise.resolve());
      jest.spyOn(domainService, 'create').mockResolvedValue(commentEntity);
      const result = await handler.execute(command);
      expect(repo.findOne).toBeCalledWith({
        where: { id: targetId, groupArchived: false, isHidden: false },
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
      const targetId = v4();
      const payload: CreateCommentCommandPayload = {
        media: {
          files: [],
          images: [],
          videos: [],
        },
        postId: targetId,
        content: 'This is a comment',
        giphyId: 'EZICHGrSD5QEFCxMiC',
        mentions: [],
        actor: {
          fullname: 'Admin EVOL',
          id: '001072e1-d214-4d3d-beab-8a5bb8784cc4',
          username: 'admin',
          email: 'admin@tgm.vn',
          avatar: '',
        },
      };
      const command = new CreateCommentCommand(payload);
      jest.spyOn(repo, 'findOne').mockResolvedValue(null);
      await expect(handler.execute(command)).rejects.toThrowError(ContentNotFoundException);
    });
  });

  it('Should throw error when content do not allow comment', async () => {
    const targetId = v4();
    const payload: CreateCommentCommandPayload = {
      media: {
        files: [],
        images: [],
        videos: [],
      },
      postId: targetId,
      content: 'This is a comment',
      giphyId: 'EZICHGrSD5QEFCxMiC',
      mentions: [],
      actor: {
        fullname: 'Admin EVOL',
        id: '001072e1-d214-4d3d-beab-8a5bb8784cc4',
        username: 'admin',
        email: 'admin@tgm.vn',
        avatar: '',
      },
    };
    const command = new CreateCommentCommand(payload);

    const postEntity = new PostEntity({
      ...postProps,
      id: targetId,
      setting: { ...postProps.setting, canComment: false },
    });
    jest.spyOn(repo, 'findOne').mockResolvedValue(postEntity);
    await expect(handler.execute(command)).rejects.toThrowError(
      ContentNoCommentPermissionException
    );
  });

  it('Should create comment with mention successfully', async () => {
    const targetId = v4();
    const payload: CreateCommentCommandPayload = {
      media: {
        files: [],
        images: [],
        videos: [],
      },
      postId: targetId,
      content: 'This is a comment',
      giphyId: 'EZICHGrSD5QEFCxMiC',
      mentions: userMentions.map((mention) => mention.id),
      actor: {
        fullname: 'Admin EVOL',
        id: '001072e1-d214-4d3d-beab-8a5bb8784cc4',
        username: 'admin',
        email: 'admin@tgm.vn',
        avatar: '',
      },
    };
    const command = new CreateCommentCommand(payload);
    const commentEntity = new CommentEntity({
      id: v4(),
      postId: targetId,
      parentId: NIL,
      content: payload.content,
      giphyId: payload.giphyId,
      media: {
        files: [],
        images: [],
        videos: [],
      },
      mentions: payload.mentions,
      createdBy: payload.actor.id,
      updatedBy: payload.actor.id,
    });

    const commentDto = new CreateCommentDto({
      id: commentEntity.get('id'),
      edited: commentEntity.get('edited'),
      parentId: commentEntity.get('parentId'),
      postId: commentEntity.get('postId'),
      totalReply: commentEntity.get('totalReply'),
      content: commentEntity.get('content'),
      giphyId: commentEntity.get('giphyId'),
      giphyUrl: createUrlFromId(commentEntity.get('giphyId')),
      createdAt: commentEntity.get('createdAt'),
      createdBy: commentEntity.get('createdBy'),
      media: {
        files: commentEntity.get('media').files.map((item) => new FileDto(item.toObject())),
        images: commentEntity.get('media').images.map((item) => new ImageDto(item.toObject())),
        videos: commentEntity.get('media').videos.map((item) => new VideoDto(item.toObject())),
      },
      mentions: {
        [userMentions[0].username]: userMentions[0],
      },
      actor: new UserDto(payload.actor),
    });
    const postEntity = new PostEntity({ ...postProps, id: targetId });
    jest.spyOn(repo, 'findOne').mockResolvedValue(postEntity);
    repo.findOne = jest.fn().mockResolvedValue(Promise.resolve());
    jest.spyOn(userApplicationService, 'findAllByIds').mockResolvedValue(userMentions);
    jest.spyOn(domainService, 'create').mockResolvedValue(commentEntity);
    const result = await handler.execute(command);
    expect(repo.findOne).toBeCalledWith({
      where: { id: targetId, groupArchived: false, isHidden: false },
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
});
