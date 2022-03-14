import { createMock } from '@golevelup/ts-jest';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { CommentReactionModel } from 'src/database/models/comment-reaction.model';
import { PostReactionModel } from 'src/database/models/post-reaction.model';
import { ReactionService } from '../reaction.service';
import { mockCreateReactionDto, mockUserDto } from './mocks/input.mock';

describe('ReactionService', () => {
  let reactionService: ReactionService;
  let commentReactionModel: typeof CommentReactionModel;
  let postReactionModel: typeof PostReactionModel;

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
    }).compile();

    reactionService = module.get<ReactionService>(ReactionService);
    commentReactionModel = module.get<typeof CommentReactionModel>(getModelToken(CommentReactionModel));
    postReactionModel = module.get<typeof PostReactionModel>(getModelToken(PostReactionModel));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Create reaction', () => {
    describe('Create post reaction', () => {
      it('Create post reaction successfully', async () => {
        const input = mockCreateReactionDto[0];
        const mockDataCreated = createMock<PostReactionModel>({
          id: 1,
          postId: input.targetId,
          reactionName: input.reactionName,
          createdBy: mockUserDto.userId,
        });
        const postReactionModelCreateSpy = jest.spyOn(postReactionModel, 'create').mockResolvedValue(mockDataCreated);
        const postReactionModelFindOneSpy = jest.spyOn(postReactionModel, 'findOne').mockResolvedValue(null);
        expect(await reactionService.createReaction(mockUserDto, input)).toEqual(true);
        expect(postReactionModelCreateSpy).toBeCalledTimes(1);
        expect(postReactionModelFindOneSpy).toBeCalledTimes(1);
      });

      it('Create post reaction failed because of non-existed postId', async () => {
        const input = mockCreateReactionDto[0];
        const postReactionModelCreateSpy = jest
          .spyOn(postReactionModel, 'create')
          .mockRejectedValue(new Error('postId is not existed. foreign key constraint'));
        const postReactionModelFindOneSpy = jest.spyOn(postReactionModel, 'findOne').mockResolvedValue(null);
        try {
          await reactionService.createReaction(mockUserDto, input);
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
        const postReactionModelFindOneSpy = jest
          .spyOn(postReactionModel, 'findOne')
          .mockResolvedValue(mockDataFoundOne);
        try {
          await reactionService.createReaction(mockUserDto, input);
        } catch (e) {
          expect(e.message).toBe('Can not create reaction.');
        }
        expect(postReactionModelCreateSpy).toBeCalledTimes(0);
        expect(postReactionModelFindOneSpy).toBeCalledTimes(1);
      });
    });

    describe('Create comment reaction', () => {
      it('Create comment reaction successfully', async () => {
        const input = mockCreateReactionDto[1];
        const mockDataCreated = createMock<CommentReactionModel>({
          id: 1,
          commentId: input.targetId,
          reactionName: input.reactionName,
          createdBy: mockUserDto.userId,
        });
        const commentReactionModelCreateSpy = jest
          .spyOn(commentReactionModel, 'create')
          .mockResolvedValue(mockDataCreated);
        const commentReactionModelFindOneSpy = jest.spyOn(commentReactionModel, 'findOne').mockResolvedValue(null);
        expect(await reactionService.createReaction(mockUserDto, input)).toEqual(true);
        expect(commentReactionModelCreateSpy).toBeCalledTimes(1);
        expect(commentReactionModelFindOneSpy).toBeCalledTimes(1);
      });

      it('Create comment reaction failed because of non-existed commentId', async () => {
        const input = mockCreateReactionDto[1];
        const commentReactionModelCreateSpy = jest
          .spyOn(commentReactionModel, 'create')
          .mockRejectedValue(new Error('commentId is not existed. foreign key constraint'));
        const commentReactionModelFindOneSpy = jest.spyOn(commentReactionModel, 'findOne').mockResolvedValue(null);
        try {
          await reactionService.createReaction(mockUserDto, input);
        } catch (e) {
          expect(e.message).toBe('Can not create reaction.');
        }
        expect(commentReactionModelCreateSpy).toBeCalledTimes(1);
        expect(commentReactionModelFindOneSpy).toBeCalledTimes(1);
      });

      it('Create comment reaction failed because of existed reaction', async () => {
        const input = mockCreateReactionDto[1];
        const mockDataCreated = createMock<CommentReactionModel>({
          id: 2,
          commentId: input.targetId,
          reactionName: input.reactionName,
          createdBy: mockUserDto.userId,
        });
        const mockDataFoundOne = createMock<CommentReactionModel>({
          id: 1,
          commentId: input.targetId,
          reactionName: input.reactionName,
          createdBy: mockUserDto.userId,
        });
        const commentReactionModelCreateSpy = jest
          .spyOn(commentReactionModel, 'create')
          .mockResolvedValue(mockDataCreated);
        const commentReactionModelFindOneSpy = jest
          .spyOn(commentReactionModel, 'findOne')
          .mockResolvedValue(mockDataFoundOne);
        try {
          await reactionService.createReaction(mockUserDto, input);
        } catch (e) {
          expect(e.message).toBe('Can not create reaction.');
        }
        expect(commentReactionModelCreateSpy).toBeCalledTimes(0);
        expect(commentReactionModelFindOneSpy).toBeCalledTimes(1);
      });
    });
  });
});
