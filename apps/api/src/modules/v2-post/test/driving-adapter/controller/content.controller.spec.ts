import { CONTENT_TYPE, ORDER } from '@beincom/constants';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { I18nContext } from 'nestjs-i18n';

import { GetScheduleContentsResponseDto } from '../../../application/dto';
import { GetScheduleContentQuery } from '../../../application/query/content/get-schedule-content';
import { ContentController } from '../../../driving-apdater/controller/content.controller';
import { GetScheduleContentsQueryDto } from '../../../driving-apdater/dto/request';
import { postMock } from '../../mock/post.dto.mock';
import { userMock } from '../../mock/user.dto.mock';

describe('ContentController', () => {
  let contentController: ContentController;
  let query: QueryBus;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContentController, CommandBus, QueryBus],
    }).compile();

    contentController = module.get<ContentController>(ContentController);
    query = module.get<QueryBus>(QueryBus);

    jest.spyOn(I18nContext, 'current').mockImplementation(
      () =>
        ({
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          t: () => {},
        } as any)
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Get schedule contents', () => {
    const queryMock: GetScheduleContentsQueryDto = {
      limit: 10,
      order: ORDER.ASC,
      type: CONTENT_TYPE.POST,
    };

    it('Should get schedule contents successfully', async () => {
      const queryExecute = jest.spyOn(query, 'execute').mockResolvedValue(
        new GetScheduleContentsResponseDto([postMock], {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: 'startCursor',
          endCursor: 'endCursor',
        })
      );
      const res = await contentController.getScheduleContents(userMock, queryMock);

      expect(queryExecute).toBeCalledTimes(1);
      expect(queryExecute).toBeCalledWith(
        new GetScheduleContentQuery({
          user: userMock,
          limit: 10,
          order: ORDER.ASC,
          type: CONTENT_TYPE.POST,
        })
      );
      expect(res).toEqual(
        new GetScheduleContentsResponseDto([postMock], {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: 'startCursor',
          endCursor: 'endCursor',
        })
      );
    });
  });
});
