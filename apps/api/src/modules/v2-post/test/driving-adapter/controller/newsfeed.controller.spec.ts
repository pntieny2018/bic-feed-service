import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';

import { NewsFeedController } from '../../../driving-apdater/controller/newsfeed.controller';
import { NewsfeedRequestDto } from '../../../driving-apdater/dto/request';
import { newsfeedDtoMock } from '../../mock/newsfeed.mock';
import { createMockUserDto } from '../../mock/user.mock';

const userMock = createMockUserDto();

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
      } as NewsfeedRequestDto);
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
      const queryExecute = jest.spyOn(queryBus, 'execute').mockResolvedValue({
        list: [newsfeedDtoMock],
        meta: {
          has_next_page: true,
          end_cursor: 'eyJvZmZzZXQiOjF9',
        },
      });
      const result = await newsfeedController.getNewsfeed(null, {
        isMine: true,
      } as NewsfeedRequestDto);
      expect(queryExecute).toBeCalledWith({
        payload: {
          authUser: null,
          isMine: true,
        },
      });
      expect(result).toEqual({
        list: [newsfeedDtoMock],
        meta: {
          has_next_page: true,
          end_cursor: 'eyJvZmZzZXQiOjF9',
        },
      });
    });

    it('should throw exception when get newsfeed', async () => {
      const queryExecute = jest
        .spyOn(queryBus, 'execute')
        .mockRejectedValue(new Error('mock test error'));

      await expect(
        newsfeedController.getNewsfeed(userMock, { limit: 1 } as NewsfeedRequestDto)
      ).rejects.toThrowError('mock test error');

      expect(queryExecute).toBeCalledWith({
        payload: {
          authUser: userMock,
          limit: 1,
        },
      });
    });
  });
});
