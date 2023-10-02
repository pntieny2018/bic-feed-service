import { CONTENT_STATUS, ORDER } from '@beincom/constants';
import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';

import {
  ContentBinding,
  CONTENT_BINDING_TOKEN,
  IContentBinding,
} from '../../../../application/binding';
import { GetScheduleContentsResponseDto } from '../../../../application/dto';
import { GetScheduleContentHandler } from '../../../../application/query/content/get-schedule-content';
import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../../domain/domain-service/interface';
import {
  createMockArticleDto,
  createMockArticleEntity,
  createMockPostDto,
  createMockPostEntity,
} from '../../../mock/content.mock';
import { createMockUserDto } from '../../../mock/user.mock';

const postEntityMock = createMockPostEntity();
const postMock = createMockPostDto();
const articleEntityMock = createMockArticleEntity();
const articleDtoMock = createMockArticleDto();
const userMock = createMockUserDto();

describe('GetScheduleContentHandler', () => {
  let handler: GetScheduleContentHandler;
  let contentDomainService: IContentDomainService;
  let contentBinding: ContentBinding;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GetScheduleContentHandler,

        {
          provide: CONTENT_DOMAIN_SERVICE_TOKEN,
          useValue: createMock<IContentDomainService>(),
        },
        {
          provide: CONTENT_BINDING_TOKEN,
          useValue: createMock<IContentBinding>(),
        },
      ],
    }).compile();
    handler = module.get(GetScheduleContentHandler);
    contentDomainService = module.get(CONTENT_DOMAIN_SERVICE_TOKEN);
    contentBinding = module.get(CONTENT_BINDING_TOKEN);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('execute', () => {
    it('should execute query successfully', async () => {
      jest.spyOn(contentDomainService, 'getScheduleContentIds').mockResolvedValue({
        rows: [articleEntityMock.get('id'), postEntityMock.get('id')],
        meta: {
          startCursor:
            'eyJzY2hlZHVsZWRBdCI6IjIwMjMtMTItMjlUMTE6MDA6MDAuMDAwWiIsImNyZWF0ZWRBdCI6IjIwMjMtMDYtMjlUMTA6NTA6NTcuOTQ0WiJ9',
          endCursor:
            'eyJzY2hlZHVsZWRBdCI6IjIwMjMtMTItMjlUMTE6MDA6MDAuMDAwWiIsImNyZWF0ZWRBdCI6IjIwMjMtMDYtMjlUMTA6NTA6NTcuOTQ0WiJ9',
          hasNextPage: true,
          hasPreviousPage: false,
        },
      });
      jest
        .spyOn(contentDomainService, 'getContentByIds')
        .mockResolvedValue([articleEntityMock, postEntityMock]);
      jest.spyOn(contentBinding, 'contentsBinding').mockResolvedValue([
        {
          ...articleDtoMock,
          status: CONTENT_STATUS.WAITING_SCHEDULE,
        },
        {
          ...postMock,
          status: CONTENT_STATUS.SCHEDULE_FAILED,
        },
      ]);
      const result = await handler.execute({
        payload: {
          limit: 2,
          order: ORDER.ASC,
          user: userMock,
        },
      });

      expect(result).toEqual(
        new GetScheduleContentsResponseDto(
          [
            { ...articleDtoMock, status: CONTENT_STATUS.WAITING_SCHEDULE },
            {
              ...postMock,
              status: CONTENT_STATUS.SCHEDULE_FAILED,
            },
          ],
          {
            startCursor:
              'eyJzY2hlZHVsZWRBdCI6IjIwMjMtMTItMjlUMTE6MDA6MDAuMDAwWiIsImNyZWF0ZWRBdCI6IjIwMjMtMDYtMjlUMTA6NTA6NTcuOTQ0WiJ9',
            endCursor:
              'eyJzY2hlZHVsZWRBdCI6IjIwMjMtMTItMjlUMTE6MDA6MDAuMDAwWiIsImNyZWF0ZWRBdCI6IjIwMjMtMDYtMjlUMTA6NTA6NTcuOTQ0WiJ9',
            hasNextPage: true,
            hasPreviousPage: false,
          }
        )
      );
    });
  });
});
