import { RecentSearchController } from '../../../driving-adapter/controller/recent-search.controller';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import { I18nContext } from 'nestjs-i18n';
import { OrderEnum } from '../../../../../common/dto';
import { BadRequestException } from '@nestjs/common';
import { userMock } from '../../../../v2-post/test/mock/user.dto.mock';
import { RecentSearchType } from '../../../data-type';
import { RecentSearchNotFoundException } from '../../../domain/exception';

describe('RecentSearchController', () => {
  let recentSearchController: RecentSearchController;
  let commandBus: CommandBus;
  let queryBus: QueryBus;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [RecentSearchController, CommandBus, QueryBus],
    }).compile();

    recentSearchController = module.get<RecentSearchController>(RecentSearchController);
    commandBus = module.get<CommandBus>(CommandBus);
    queryBus = module.get<QueryBus>(QueryBus);

    jest.spyOn(I18nContext, 'current').mockImplementation(
      () =>
        ({
          t: (...args) => {},
        } as any)
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const recentSearchMock = {
    id: 'f2e60f9d-4e77-42f6-bb63-007e3a18ec67',
    keyword: 'a keyword',
  };

  describe('Get', () => {
    const getRecentSearchDto = {
      target: RecentSearchType.POST,
      offset: 0,
      limit: 10,
      order: OrderEnum.DESC,
    };

    it('Should get recent search successfully', async () => {
      jest.spyOn(queryBus, 'execute').mockResolvedValue({ rows: [recentSearchMock], total: 1 });
      const result = await recentSearchController.getRecentSearches(userMock, getRecentSearchDto);
      expect(result).toEqual({
        recentSearches: [recentSearchMock],
        target: getRecentSearchDto.target,
      });
    });
  });

  describe('Create', () => {
    const createRecentSearchDto = {
      target: RecentSearchType.POST,
      keyword: 'a keyword',
    };
    it('Should create recent search successfully', async () => {
      jest.spyOn(commandBus, 'execute').mockResolvedValue(recentSearchMock);
      const result = await recentSearchController.createRecentSearch(
        userMock,
        createRecentSearchDto
      );
      expect(result).toEqual(recentSearchMock);
    });
  });

  describe('Delete', () => {
    const deleteRecentSearchDto = recentSearchMock.id;
    it('Should delete recent search successfully', async () => {
      jest.spyOn(commandBus, 'execute').mockResolvedValue(undefined);
      const result = await recentSearchController.deleteRecentSearch(
        userMock,
        deleteRecentSearchDto
      );
      expect(result).toEqual(true);
    });
    it('Should throw error when delete recent search failed', async () => {
      const error = new RecentSearchNotFoundException();
      jest.spyOn(commandBus, 'execute').mockRejectedValue(error);
      try {
        await recentSearchController.deleteRecentSearch(userMock, deleteRecentSearchDto);
      } catch (e) {
        expect(e).toEqual(new BadRequestException(error));
      }
    });
  });

  describe('Clean', () => {
    const target = { target: RecentSearchType.ALL };
    it('Should clean recent search successfully', async () => {
      jest.spyOn(commandBus, 'execute').mockResolvedValue(undefined);
      const result = await recentSearchController.cleanRecentSearch(userMock, target);
      expect(result).toEqual(true);
    });
    it('Should throw error when clean recent search failed', async () => {
      const error = new RecentSearchNotFoundException();
      jest.spyOn(commandBus, 'execute').mockRejectedValue(error);
      try {
        await recentSearchController.cleanRecentSearch(userMock, target);
      } catch (e) {
        expect(e).toEqual(new BadRequestException(error));
      }
    });
  });
});
