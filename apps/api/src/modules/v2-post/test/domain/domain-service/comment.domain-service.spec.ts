import { IMAGE_RESOURCE } from '@beincom/constants';
import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { cloneDeep, omit } from 'lodash';
import { I18nContext } from 'nestjs-i18n';
import { v4 } from 'uuid';

import { DatabaseException } from '../../../../../common/exceptions/database.exception';
import { CommentDomainService } from '../../../domain/domain-service/comment.domain-service';
import { ICommentDomainService } from '../../../domain/domain-service/interface';
import {
  IMediaDomainService,
  MEDIA_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface/media.domain-service.interface';
import { MediaDomainService } from '../../../domain/domain-service/media.domain-service';
import { CommentNotEmptyException } from '../../../domain/exception';
import { InvalidResourceImageException } from '../../../domain/exception/media.exception';
import { CommentFactory } from '../../../domain/factory';
import { COMMENT_FACTORY_TOKEN, ICommentFactory } from '../../../domain/factory/interface';
import { CommentAttributes, CommentEntity } from '../../../domain/model/comment';
import { COMMENT_REPOSITORY_TOKEN, ICommentRepository } from '../../../domain/repositoty-interface';
import { IMentionValidator, MENTION_VALIDATOR_TOKEN } from '../../../domain/validator/interface';
import { MentionValidator } from '../../../domain/validator/mention.validator';
import { CommentRepository } from '../../../driven-adapter/repository/comment.repository';
import {
  createCommentProps,
  notChangedCommentProps,
  updateCommentProps,
} from '../../mock/comment.props.mock';
import { createMockImageEntity } from '../../mock/media.mock';

const imageEntites = [createMockImageEntity()];
const invalidImageComment = [createMockImageEntity({ resource: IMAGE_RESOURCE.POST_CONTENT })];

describe('CommentDomainService', () => {
  let domainService: ICommentDomainService;
  let repo: ICommentRepository;
  let factory: ICommentFactory;
  let mediaDomainService: IMediaDomainService;
  let mentionValidator: IMentionValidator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentDomainService,
        {
          provide: COMMENT_FACTORY_TOKEN,
          useValue: createMock<CommentFactory>(),
        },
        {
          provide: COMMENT_REPOSITORY_TOKEN,
          useValue: createMock<CommentRepository>(),
        },
        {
          provide: MEDIA_DOMAIN_SERVICE_TOKEN,
          useValue: createMock<MediaDomainService>(),
        },
        {
          provide: MENTION_VALIDATOR_TOKEN,
          useValue: createMock<MentionValidator>(),
        },
      ],
    }).compile();

    domainService = module.get<CommentDomainService>(CommentDomainService);
    repo = module.get<ICommentRepository>(COMMENT_REPOSITORY_TOKEN);
    factory = module.get<ICommentFactory>(COMMENT_FACTORY_TOKEN);
    mediaDomainService = module.get<IMediaDomainService>(MEDIA_DOMAIN_SERVICE_TOKEN);
    mentionValidator = module.get<IMentionValidator>(MENTION_VALIDATOR_TOKEN);

    jest.spyOn(I18nContext, 'current').mockImplementation(
      () =>
        ({
          t: () => {},
        } as any)
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('Should create comment successfully', async () => {
      const now = new Date();
      const basedCommentEntity = new CommentEntity({
        id: v4(),
        parentId: createCommentProps.data.parentId,
        postId: createCommentProps.data.postId,
        content: createCommentProps.data.content,
        createdBy: createCommentProps.data.userId,
        updatedBy: createCommentProps.data.userId,
        media: {
          files: [],
          images: [],
          videos: [],
        },
        mentions: createCommentProps.data.mentions,
        isHidden: false,
        edited: false,
        createdAt: now,
        updatedAt: now,
        giphyId: createCommentProps.data.giphyId,
      });
      jest.spyOn(mediaDomainService, 'getAvailableImages').mockResolvedValue(imageEntites);
      jest.spyOn(factory, 'createComment').mockReturnValue(basedCommentEntity);
      const commentEntityWithMedia = cloneDeep(basedCommentEntity);
      commentEntityWithMedia.setMedia({
        files: basedCommentEntity.get('media').files,
        images: imageEntites,
        videos: basedCommentEntity.get('media').videos,
      });
      jest.spyOn(repo, 'createComment').mockResolvedValue(commentEntityWithMedia);
      repo.createComment = jest.fn().mockResolvedValue(Promise.resolve());
      factory.createComment = jest.fn().mockResolvedValue(Promise.resolve());
      const commentEntity = await domainService.create(createCommentProps);

      expect(mentionValidator.validateMentionUsers).toBeCalledWith(
        createCommentProps.mentionUsers,
        createCommentProps.groups
      );
      expect(factory.createComment).toBeCalledWith(omit(createCommentProps.data, 'media'));
      expect(repo.createComment).toBeCalledWith(basedCommentEntity);
      expect(commentEntity).toEqual(commentEntityWithMedia);
    });

    it('Should throw error invalid image resource', async () => {
      const now = new Date();
      const basedCommentEntity = new CommentEntity({
        id: v4(),
        parentId: createCommentProps.data.parentId,
        postId: createCommentProps.data.postId,
        content: createCommentProps.data.content,
        createdBy: createCommentProps.data.userId,
        updatedBy: createCommentProps.data.userId,
        media: {
          files: [],
          images: [],
          videos: [],
        },
        mentions: createCommentProps.data.mentions,
        isHidden: false,
        edited: false,
        createdAt: now,
        updatedAt: now,
        giphyId: createCommentProps.data.giphyId,
      });
      jest.spyOn(mediaDomainService, 'getAvailableImages').mockResolvedValue(invalidImageComment);
      jest.spyOn(factory, 'createComment').mockReturnValue(basedCommentEntity);
      try {
        await domainService.create(createCommentProps);
      } catch (e) {
        expect(mentionValidator.validateMentionUsers).toBeCalledWith(
          createCommentProps.mentionUsers,
          createCommentProps.groups
        );
        expect(factory.createComment).toBeCalledWith(omit(createCommentProps.data, 'media'));
        expect(e).toEqual(new InvalidResourceImageException());
      }
    });

    it('Should throw a database exception', async () => {
      const logError = jest.spyOn(domainService['_logger'], 'error').mockReturnThis();
      const now = new Date();
      const basedCommentEntity = new CommentEntity({
        id: v4(),
        parentId: createCommentProps.data.parentId,
        postId: createCommentProps.data.postId,
        content: createCommentProps.data.content,
        createdBy: createCommentProps.data.userId,
        updatedBy: createCommentProps.data.userId,
        media: {
          files: [],
          images: [],
          videos: [],
        },
        mentions: createCommentProps.data.mentions,
        isHidden: false,
        edited: false,
        createdAt: now,
        updatedAt: now,
        giphyId: createCommentProps.data.giphyId,
      });
      jest.spyOn(mediaDomainService, 'getAvailableImages').mockResolvedValue(imageEntites);
      jest.spyOn(factory, 'createComment').mockReturnValue(basedCommentEntity);
      jest.spyOn(repo, 'createComment').mockImplementation(() => {
        throw new Error('Database error');
      });
      repo.createComment = jest.fn().mockResolvedValue(Promise.resolve());
      factory.createComment = jest.fn().mockResolvedValue(Promise.resolve());

      try {
        await domainService.create(createCommentProps);
      } catch (error) {
        expect(mentionValidator.validateMentionUsers).toBeCalledWith(
          createCommentProps.mentionUsers,
          createCommentProps.groups
        );
        expect(factory.createComment).toBeCalledWith(omit(createCommentProps.data, 'media'));
        expect(repo.createComment).toBeCalledWith(basedCommentEntity);
        expect(logError).toBeCalled();
        expect(error).toBeInstanceOf(DatabaseException);
      }
    });
  });

  describe('update', () => {
    it('Should update comment successfully', async () => {
      const props = cloneDeep(updateCommentProps);
      jest.spyOn(mediaDomainService, 'getAvailableImages').mockResolvedValue(imageEntites);
      const commentEntityWithMedia = cloneDeep(props.commentEntity);
      commentEntityWithMedia.setMedia({
        files: props.commentEntity.get('media').files,
        images: imageEntites,
        videos: props.commentEntity.get('media').videos,
      });
      commentEntityWithMedia.updateAttribute(
        props.newData as unknown as CommentAttributes,
        props.actor.id
      );
      await domainService.update(props);

      expect(mentionValidator.validateMentionUsers).toBeCalledWith(
        props.mentionUsers,
        props.groups
      );
      expect(repo.update).toBeCalledWith(props.commentEntity);
      expect(omit(props.commentEntity.toObject(), ['updatedAt'])).toEqual(
        omit(commentEntityWithMedia.toObject(), ['updatedAt'])
      );
    });

    it('Should throw error invalid image resource', async () => {
      const props = cloneDeep(updateCommentProps);
      jest.spyOn(mediaDomainService, 'getAvailableImages').mockResolvedValue(invalidImageComment);
      try {
        await domainService.update(props);
      } catch (e) {
        expect(e).toEqual(new InvalidResourceImageException());
      }
    });

    it('Should throw error because comment is empty', async () => {
      const props = cloneDeep(updateCommentProps);
      try {
        await domainService.update({
          ...props,
          newData: {
            ...props.newData,
            content: '',
            giphyId: '',
            mentions: [],
            media: undefined,
          },
        });
      } catch (error) {
        expect(error).toBeInstanceOf(CommentNotEmptyException);
      }
    });
  });

  it('Should return void because the comment is not changed', async () => {
    const props = cloneDeep(notChangedCommentProps);
    await domainService.update({
      ...props,
      newData: {
        ...props.newData,
        media: undefined,
      },
    });
    expect(mentionValidator.validateMentionUsers).toBeCalledWith(props.mentionUsers, props.groups);
    expect(repo.update).toBeCalledTimes(0);
  });
});
