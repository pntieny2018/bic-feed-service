import { Test, TestingModule } from '@nestjs/testing';
import { NIL, v4 } from 'uuid';
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
  UserDto,
} from '../../../../v2-user/application';
import { CONTENT_BINDING_TOKEN } from '../../../application/binding/binding-post/content.interface';
import { ContentBinding } from '../../../application/binding/binding-post/content.binding';
import { PostEntity } from '../../../domain/model/content';
import { postProps } from '../../mock/post.props.mock';
import {
  ReplyCommentCommand,
  ReplyCommentCommandPayload,
} from '../../../application/command/reply-comment/reply-comment.command';
import { CommentEntity } from '../../../domain/model/comment';
import { CreateCommentDto } from '../../../application/command/create-comment/create-comment.dto';
import { createUrlFromId } from '../../../../v2-giphy/giphy.util';
import { FileDto, ImageDto, VideoDto } from '../../../application/dto';
import { InternalEventEmitterService } from '../../../../../app/custom/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CommentHasBeenCreatedEvent } from '../../../../../events/comment';
import {
  CommentReplyNotExistException,
  ContentNoCommentPermissionException,
  ContentNotFoundException,
} from '../../../domain/exception';
import { userMentions, userMock } from '../../mock/user.dto.mock';
import { ImageEntity } from '../../../domain/model/media';
import { ImageResource } from '../../../data-type';
import { ContentRepository } from '../../../driven-adapter/repository/content.repository';
import {
  COMMENT_REPOSITORY_TOKEN,
  CONTENT_REPOSITORY_TOKEN,
  ICommentRepository,
  IContentRepository,
} from '../../../domain/repositoty-interface';
import { ReplyCommentHandler } from '../../../application/command/reply-comment/reply-comment.handler';
import { CommentRepository } from '../../../driven-adapter/repository/comment.repository';
import { createCommentDto } from '../../mock/comment.dto.mock';

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
    it('Should reply comment successfully', async () => {
      const parentTagetId = v4();
      const targetId = v4();
      const payload: ReplyCommentCommandPayload = {
        media: {
          files: [],
          images: ['ea62f4f6-92a1-4c0b-9f4a-7680544e6a44'],
          videos: [],
        },
        parentId: parentTagetId,
        postId: targetId,
        content: 'This is a comment',
        giphyId: 'EZICHGrSD5QEFCxMiC',
        mentions: [],
        actor: userMock,
      };
      const command = new ReplyCommentCommand(payload);
      const commentEntity = new CommentEntity({
        id: v4(),
        postId: targetId,
        parentId: payload.parentId,
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

      const parentCommentEntity = new CommentEntity({
        id: parentTagetId,
        postId: targetId,
        parentId: NIL,
        content: 'This is a parent comment',
        giphyId: '',
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

      const commentDto = createCommentDto(commentEntity);
      const postEntity = new PostEntity({ ...postProps, id: targetId });
      jest.spyOn(commentRepo, 'findOne').mockResolvedValue(parentCommentEntity);
      commentRepo.findOne = jest.fn().mockResolvedValue(Promise.resolve());
      jest.spyOn(repo, 'findOne').mockResolvedValue(postEntity);
      repo.findOne = jest.fn().mockResolvedValue(Promise.resolve());
      jest.spyOn(domainService, 'create').mockResolvedValue(commentEntity);
      const result = await handler.execute(command);
      expect(commentRepo.findOne).toBeCalledWith({
        id: parentTagetId,
        parentId: NIL,
      });
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
      const parentTagetId = v4();
      const targetId = v4();
      const payload: ReplyCommentCommandPayload = {
        media: {
          files: [],
          images: [],
          videos: [],
        },
        parentId: parentTagetId,
        postId: targetId,
        content: 'This is a comment',
        giphyId: 'EZICHGrSD5QEFCxMiC',
        mentions: [],
        actor: userMock,
      };
      const parentCommentEntity = new CommentEntity({
        id: parentTagetId,
        postId: targetId,
        parentId: NIL,
        content: 'This is a parent comment',
        giphyId: '',
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
      const command = new ReplyCommentCommand(payload);
      jest.spyOn(commentRepo, 'findOne').mockResolvedValue(parentCommentEntity);
      commentRepo.findOne = jest.fn().mockResolvedValue(Promise.resolve());
      jest.spyOn(repo, 'findOne').mockResolvedValue(null);
      await expect(handler.execute(command)).rejects.toThrowError(ContentNotFoundException);
      expect(commentRepo.findOne).toBeCalledWith({
        id: parentTagetId,
        parentId: NIL,
      });
    });
  });

  it('Should throw error when content do not allow comment', async () => {
    const parentTagetId = v4();
    const targetId = v4();
    const payload: ReplyCommentCommandPayload = {
      media: {
        files: [],
        images: [],
        videos: [],
      },
      parentId: parentTagetId,
      postId: targetId,
      content: 'This is a comment',
      giphyId: 'EZICHGrSD5QEFCxMiC',
      mentions: [],
      actor: userMock,
    };
    const command = new ReplyCommentCommand(payload);

    const postEntity = new PostEntity({
      ...postProps,
      id: targetId,
      setting: { ...postProps.setting, canComment: false },
    });
    const parentCommentEntity = new CommentEntity({
      id: parentTagetId,
      postId: targetId,
      parentId: NIL,
      content: 'This is a parent comment',
      giphyId: '',
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

    jest.spyOn(commentRepo, 'findOne').mockResolvedValue(parentCommentEntity);
    jest.spyOn(repo, 'findOne').mockResolvedValue(postEntity);
    commentRepo.findOne = jest.fn().mockResolvedValue(Promise.resolve());
    commentRepo.findOne = jest.fn().mockResolvedValue(Promise.resolve());
    await expect(handler.execute(command)).rejects.toThrowError(
      ContentNoCommentPermissionException
    );
    expect(commentRepo.findOne).toBeCalledWith({
      id: parentTagetId,
      parentId: NIL,
    });
  });

  it('Should throw error when not found parent comment', async () => {
    const parentTagetId = v4();
    const targetId = v4();
    const payload: ReplyCommentCommandPayload = {
      media: {
        files: [],
        images: [],
        videos: [],
      },
      parentId: parentTagetId,
      postId: targetId,
      content: 'This is a comment',
      giphyId: 'EZICHGrSD5QEFCxMiC',
      mentions: [],
      actor: userMock,
    };
    const command = new ReplyCommentCommand(payload);
    jest.spyOn(commentRepo, 'findOne').mockResolvedValue(null);
    await expect(handler.execute(command)).rejects.toThrowError(CommentReplyNotExistException);
  });

  it('Should reply comment with mention successfully', async () => {
    const parentTagetId = v4();
    const targetId = v4();
    const payload: ReplyCommentCommandPayload = {
      media: {
        files: [],
        images: [],
        videos: [],
      },
      parentId: parentTagetId,
      postId: targetId,
      content: 'This is a comment',
      giphyId: 'EZICHGrSD5QEFCxMiC',
      mentions: userMentions.map((mention) => mention.id),
      actor: userMock,
    };
    const command = new ReplyCommentCommand(payload);
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
