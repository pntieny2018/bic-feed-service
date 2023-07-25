import { TimelineController } from '../../../driving-apdater/controller/timeline.controller';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import { userMock } from '../../mock/user.dto.mock';
import { GetTimelineRequestDto } from '../../../driving-apdater/dto/request';
import { timelineMock } from '../../mock/timeline.dto.mock';

describe('TimelineController', () => {
  let timelineController: TimelineController;
  let commandBus: CommandBus;
  let queryBus: QueryBus;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [TimelineController, CommandBus, QueryBus],
    }).compile();

    timelineController = module.get<TimelineController>(TimelineController);
    commandBus = module.get<CommandBus>(CommandBus);
    queryBus = module.get<QueryBus>(QueryBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTimeline', () => {
    it('should get timeline successfully', async () => {
      const queryExecute = jest.spyOn(queryBus, 'execute').mockResolvedValue({
        list: [timelineMock],
        meta: {
          has_next_page: true,
          end_cursor: 'eyJvZmZzZXQiOjF9',
        },
      });

      const result = await timelineController.getTimeline(
        'groupId',
        userMock,
        {} as GetTimelineRequestDto
      );
      expect(result).toEqual({
        list: [timelineMock],
        meta: {
          has_next_page: true,
          end_cursor: 'eyJvZmZzZXQiOjF9',
        },
      });
      expect(queryExecute).toBeCalledWith({
        payload: {
          groupId: 'groupId',
          authUser: userMock,
        },
      });
    });

    it('should get timeline successfully without authUser ', async () => {
      const queryExecute = jest.spyOn(queryBus, 'execute').mockResolvedValue({});
      await timelineController.getTimeline('groupId', null, {} as GetTimelineRequestDto);
      expect(queryExecute).toBeCalledWith({
        payload: {
          groupId: 'groupId',
          authUser: null,
        },
      });
    });

    it('should throw exception when get timeline', async () => {
      const queryExecute = jest.spyOn(queryBus, 'execute').mockRejectedValue(new Error('123'));

      await expect(
        timelineController.getTimeline('1', userMock, { limit: 1 } as GetTimelineRequestDto)
      ).rejects.toThrowError('123');

      expect(queryExecute).toBeCalledWith({
        payload: {
          authUser: userMock,
          groupId: '1',
          limit: 1,
        },
      });
    });
  });
});
