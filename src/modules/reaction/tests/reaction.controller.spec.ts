import { Test, TestingModule } from '@nestjs/testing';
import { ReactionController } from '../reaction.controller';
import { CommentReactionModel } from 'src/database/models/comment-reaction.model';
import { PostReactionModel } from 'src/database/models/post-reaction.model';
import { CreateReactionService } from '../services';
import { getModelToken } from '@nestjs/sequelize';
import {
  mock15ReactionOnAPost,
  mockCreateReactionDto,
  mockPostCanReact,
  mockUserDto,
} from './mocks/input.mock';
import { createMock } from '@golevelup/ts-jest';
import { PostModel } from 'src/database/models/post.model';

describe('ReactionController', () => {
  let reactionController: ReactionController;
  let commentReactionModel: typeof CommentReactionModel;
  let postReactionModel: typeof PostReactionModel;
  let createReactionService: CreateReactionService;
  let postModel: typeof PostModel;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateReactionService,
        {
          provide: getModelToken(PostReactionModel),
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            destroy: jest.fn(),
          },
        },
        {
          provide: getModelToken(CommentReactionModel),
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            destroy: jest.fn(),
          },
        },
        {
          provide: getModelToken(PostModel),
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            destroy: jest.fn(),
          },
        },
      ],
      controllers: [ReactionController],
    }).compile();

    reactionController = module.get<ReactionController>(ReactionController);
    createReactionService = module.get<CreateReactionService>(CreateReactionService);
    commentReactionModel = module.get<typeof CommentReactionModel>(
      getModelToken(CommentReactionModel)
    );
    postReactionModel = module.get<typeof PostReactionModel>(getModelToken(PostReactionModel));
    postModel = module.get<typeof PostModel>(getModelToken(PostModel));
  });

  it('should be defined', () => {
    expect(reactionController).toBeDefined();
  });

  describe('Create reaction', () => {
    it('Create post successfully', async () => {
      const input = mockCreateReactionDto[0];
      const mock15ReactionOnAPostData = createMock<PostReactionModel[]>(mock15ReactionOnAPost);
      const postReactionModelFindAllSpy = jest
        .spyOn(postReactionModel, 'findAll')
        .mockResolvedValue(mock15ReactionOnAPostData);
      const mockPostData = createMock<PostModel>(mockPostCanReact);
      const postModelFindOneSpy = jest.spyOn(postModel, 'findOne').mockResolvedValue(mockPostData);
      const shouldBeTrue = await reactionController.create(mockUserDto, input);
      expect(shouldBeTrue).toEqual(true);
      expect(postReactionModelFindAllSpy).toBeCalledTimes(1);
      expect(postModelFindOneSpy).toBeCalledTimes(1);
    });

    it('Create post reaction failed because of non-existed postId', async () => {
      const input = mockCreateReactionDto[0];
      const postReactionModelCreateSpy = jest
        .spyOn(postReactionModel, 'create')
        .mockRejectedValue(new Error('postId is not existed. foreign key constraint'));
      const postReactionModelFindOneSpy = jest
        .spyOn(postReactionModel, 'findOne')
        .mockResolvedValue(null);
      const mock15ReactionOnAPostData = createMock<PostReactionModel[]>(mock15ReactionOnAPost);
      const postReactionModelFindAllSpy = jest
        .spyOn(postReactionModel, 'findAll')
        .mockResolvedValue(mock15ReactionOnAPostData);
      const postModelFindOneSpy = jest
        .spyOn(postModel, 'findOne')
        .mockRejectedValue(new Error('Post is not existed.'));
      try {
        await reactionController.create(mockUserDto, input);
      } catch (e) {
        expect(e.message).toBe('Can not create reaction.');
      }
      expect(postReactionModelCreateSpy).toBeCalledTimes(0);
      expect(postReactionModelFindOneSpy).toBeCalledTimes(1);
      expect(postReactionModelFindAllSpy).toBeCalledTimes(0);
      expect(postModelFindOneSpy).toBeCalledTimes(1);
    });

    it('Create post reaction failed because of existed reaction', async () => {
      const input = mockCreateReactionDto[0];
      const mockDataCreated = createMock<PostReactionModel>({
        id: 2,
        postId: input.targetId,
        reactionName: input.reactionName,
        createdBy: mockUserDto.userId,
      });
      const postReactionModelCreateSpy = jest
        .spyOn(postReactionModel, 'create')
        .mockResolvedValue(mockDataCreated);
      const mock15ReactionOnAPostData = createMock<PostReactionModel[]>(mock15ReactionOnAPost);
      const postReactionModelFindAllSpy = jest
        .spyOn(postReactionModel, 'findAll')
        .mockResolvedValue(mock15ReactionOnAPostData);
      const mockDataFoundOne = createMock<PostReactionModel>({
        id: 1,
        postId: input.targetId,
        reactionName: input.reactionName,
        createdBy: mockUserDto.userId,
      });
      const postReactionModelFindOneSpy = jest
        .spyOn(postReactionModel, 'findOne')
        .mockResolvedValue(mockDataFoundOne);
      const mockPostData = createMock<PostModel>(mockPostCanReact);
      const postModelFindOneSpy = jest.spyOn(postModel, 'findOne').mockResolvedValue(mockPostData);
      try {
        await reactionController.create(mockUserDto, input);
      } catch (e) {
        expect(e.message).toBe('Can not create reaction.');
      }
      expect(postReactionModelCreateSpy).toBeCalledTimes(0);
      expect(postReactionModelFindAllSpy).toBeCalledTimes(0);
      expect(postReactionModelFindOneSpy).toBeCalledTimes(1);
      expect(postModelFindOneSpy).toBeCalledTimes(0);
    });
  });
});
