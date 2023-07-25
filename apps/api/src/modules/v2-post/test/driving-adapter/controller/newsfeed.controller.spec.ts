import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import { userMock } from '../../mock/user.dto.mock';
import { GetNewsfeedRequestDto } from '../../../driving-apdater/dto/request';
import { NewsFeedController } from '../../../driving-apdater/controller/newsfeed.controller';
import { newsfeedDtoMock } from '../../mock/newsfeed.dto.mock';

describe('NewsFeedController', () => {
  let newsfeedController: NewsFeedController;
  let commandBus: CommandBus;
  let queryBus: QueryBus;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [NewsFeedController, CommandBus, QueryBus],
    }).compile();

    newsfeedController = module.get<NewsFeedController>(NewsFeedController);
    commandBus = module.get<CommandBus>(CommandBus);
    queryBus = module.get<QueryBus>(QueryBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getNewsfeed', () => {
    it('should get newsfeed successfully', async () => {
      const queryExecute = jest.spyOn(queryBus, 'execute').mockResolvedValue({
        list: [newsfeedDtoMock],
        meta: {
          has_next_page: true,
          end_cursor: 'eyJvZmZzZXQiOjF9',
        },
      });

      const result = await newsfeedController.getNewsfeed(userMock, {
        limit: 1,
      } as GetNewsfeedRequestDto);
      expect(result).toEqual({
        list: [newsfeedDtoMock],
        meta: {
          has_next_page: true,
          end_cursor: 'eyJvZmZzZXQiOjF9',
        },
      });
      expect(queryExecute).toBeCalledWith({
        payload: {
          authUser: userMock,
          limit: 1,
        },
      });
    });

    it('should get newsfeed successfully without authUser ', async () => {
      const queryExecute = jest.spyOn(queryBus, 'execute').mockResolvedValue({});
      await newsfeedController.getNewsfeed(null, { isMine: true } as GetNewsfeedRequestDto);
      expect(queryExecute).toBeCalledWith({
        payload: {
          authUser: null,
          isMine: true,
        },
      });
    });

    it('should throw exception when get newsfeed', async () => {
      const queryExecute = jest.spyOn(queryBus, 'execute').mockRejectedValue(new Error('123'));

      await expect(
        newsfeedController.getNewsfeed(userMock, { limit: 1 } as GetNewsfeedRequestDto)
      ).rejects.toThrowError('123');

      expect(queryExecute).toBeCalledWith({
        payload: {
          authUser: userMock,
          limit: 1,
        },
      });
    });
  });
});
