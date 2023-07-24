import { TimelineController } from '../../../driving-apdater/controller/timeline.controller';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import { userMock } from '../../mock/user.dto.mock';
import { GetTimelineRequestDto } from '../../../driving-apdater/dto/request';

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
      const queryExecute = jest.spyOn(queryBus, 'execute').mockResolvedValue({});

      const result = await timelineController.getTimeline(
        'groupId',
        userMock,
        {} as GetTimelineRequestDto
      );
      expect(result).toEqual({});
      expect(queryExecute).toBeCalledWith({
        payload: {
          groupId: 'groupId',
          authUser: userMock,
        },
      });
    });
  });
});
