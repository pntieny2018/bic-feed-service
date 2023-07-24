import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import { userMock } from '../../mock/user.dto.mock';
import { GetNewsfeedRequestDto } from '../../../driving-apdater/dto/request';
import { NewsFeedController } from '../../../driving-apdater/controller/newsfeed.controller';

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
      const queryExecute = jest.spyOn(queryBus, 'execute').mockResolvedValue({});

      const result = await newsfeedController.getNewsfeed(userMock, {} as GetNewsfeedRequestDto);
      expect(result).toEqual({});
      expect(queryExecute).toBeCalledWith({
        payload: {
          authUser: userMock,
        },
      });
    });
  });
});
