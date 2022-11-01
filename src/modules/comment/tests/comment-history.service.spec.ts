import { OrderEnum, PageDto } from '../../../common/dto';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { CommentResponseDto } from '../dto/response';
import { authUserMock } from './mocks/user.mock';
import { CommentEditedHistoryModel } from '../../../database/models/comment-edited-history.model';
import { CommentHistoryService } from '../comment-history.service';

describe('CommentHistoryService', () => {
  let commenHistoryService;
  let commentEditedHistoryModel;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentHistoryService,
        {
          provide: getModelToken(CommentEditedHistoryModel),
          useValue: {
            findAndCountAll: jest.fn(),
            create: jest.fn(),
            destroy: jest.fn(),
          },
        }
      ],
    }).compile();

    commenHistoryService = module.get<CommentHistoryService>(CommentHistoryService);
    commentEditedHistoryModel = module.get<typeof CommentEditedHistoryModel>(
      getModelToken(CommentEditedHistoryModel)
    );
  });

  it('should be defined', () => {
    expect(commenHistoryService).toBeDefined();
  });

  describe('CommentService.saveCommentEditedHistory', () => {
    it('Should successfully', async () => {
      await commenHistoryService.saveCommentEditedHistory('57dc4093-1bd0-4105-869f-8504e1986145', {
        oldData: new CommentResponseDto(null),
        newData: new CommentResponseDto(null),
      });
      expect(commentEditedHistoryModel.create).toBeCalled();
    });
  });

  describe('CommentService.deleteCommentEditedHistory', () => {
    it('Should successfully', async () => {
      await commenHistoryService.deleteCommentEditedHistory(57);
      expect(commentEditedHistoryModel.destroy).toBeCalled();
    });
  });

  describe('CommentService.getCommentEditedHistory', () => {
    it('Should successfully', async () => {
      commentEditedHistoryModel.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
      const result = await commenHistoryService.getCommentEditedHistory(
        authUserMock,
        '57dc4093-1bd0-4105-869f-8504e1986145',
        {
          idGT: 0,
          idGTE: 1,
          idLT: 101,
          idLTE: 100,
          endTime: '10-10-1010',
          offset: 0,
          limit: 1,
          order: OrderEnum.DESC,
        }
      );
      expect(result).toEqual(new PageDto([], { limit: 1, total: 0 }));
    });
  });

});
