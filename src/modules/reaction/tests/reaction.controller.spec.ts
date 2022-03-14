import { Test, TestingModule } from '@nestjs/testing';
import { ReactionController } from '../reaction.controller';
import { CommentReactionModel } from 'src/database/models/comment-reaction.model';
import { PostReactionModel } from 'src/database/models/post-reaction.model';
import { ReactionService } from '../reaction.service';
import { getModelToken } from '@nestjs/sequelize';
import { mockCreateReactionDto, mockUserDto } from './mocks/input.mock';
import { createMock } from '@golevelup/ts-jest';

describe('ReactionController', () => {
  let reactionController: ReactionController;
  let commentReactionModel: typeof CommentReactionModel;
  let postReactionModel: typeof PostReactionModel;
  let reactionService: ReactionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReactionService,
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
      ],
      controllers: [ReactionController],
    }).compile();

    reactionController = module.get<ReactionController>(ReactionController);
    reactionService = module.get<ReactionService>(ReactionService);
    commentReactionModel = module.get<typeof CommentReactionModel>(getModelToken(CommentReactionModel));
    postReactionModel = module.get<typeof PostReactionModel>(getModelToken(PostReactionModel));
  });

  it('should be defined', () => {
    expect(reactionController).toBeDefined();
  });

  describe('Create reaction', () => {
    it('Create post successfully', async () => {
      const input = mockCreateReactionDto[0];
      const shouldBeTrue = await reactionController.create(mockUserDto, input);
      expect(shouldBeTrue).toEqual(true);
    });

    it('Create post reaction failed because of non-existed postId', async () => {
      const input = mockCreateReactionDto[0];
      const postReactionModelCreateSpy = jest
        .spyOn(postReactionModel, 'create')
        .mockRejectedValue(new Error('postId is not existed. foreign key constraint'));
      const postReactionModelFindOneSpy = jest.spyOn(postReactionModel, 'findOne').mockResolvedValue(null);
      try {
        await reactionController.create(mockUserDto, input);
      } catch (e) {
        expect(e.message).toBe('Can not create reaction.');
      }
      expect(postReactionModelCreateSpy).toBeCalledTimes(1);
      expect(postReactionModelFindOneSpy).toBeCalledTimes(1);
    });

    it('Create post reaction failed because of existed reaction', async () => {
      const input = mockCreateReactionDto[0];
      const mockDataCreated = createMock<PostReactionModel>({
        id: 2,
        postId: input.targetId,
        reactionName: input.reactionName,
        createdBy: mockUserDto.userId,
      });
      const mockDataFoundOne = createMock<PostReactionModel>({
        id: 1,
        postId: input.targetId,
        reactionName: input.reactionName,
        createdBy: mockUserDto.userId,
      });
      const postReactionModelCreateSpy = jest.spyOn(postReactionModel, 'create').mockResolvedValue(mockDataCreated);
      const postReactionModelFindOneSpy = jest.spyOn(postReactionModel, 'findOne').mockResolvedValue(mockDataFoundOne);
      try {
        await reactionController.create(mockUserDto, input);
      } catch (e) {
        expect(e.message).toBe('Can not create reaction.');
      }
      expect(postReactionModelCreateSpy).toBeCalledTimes(0);
      expect(postReactionModelFindOneSpy).toBeCalledTimes(1);
    });
  });
});
