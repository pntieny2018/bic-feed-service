import { createMock } from '@golevelup/ts-jest';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

import { LinkPreviewModel } from '../../../../../database/models/link-preview.model';
import { LINK_PREVIEW_FACTORY_TOKEN } from '../../../domain/factory/interface/link-preview.factory.interface';
import { LinkPreviewFactory } from '../../../domain/factory/link-preview.factory';
import { ILinkPreviewRepository } from '../../../domain/repositoty-interface';
import { LinkPreviewRepository } from '../../../driven-adapter/repository/link-preview.repository';
import {
  createMockLinkPreviewEntity,
  createMockLinkPreviewRecord,
} from '../../mock/link-preview.mock';

const transaction = createMock<Transaction>();
const mockLinkPreviewRecord = createMockLinkPreviewRecord();
const mockLinkPreviewEntity = createMockLinkPreviewEntity();

describe('LinkPreviewRepository', () => {
  let repo: ILinkPreviewRepository;
  let linkPreViewModel, linkPreviewFactory;
  let sequelizeConnection;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinkPreviewRepository,
        {
          provide: getModelToken(LinkPreviewModel),
          useValue: createMock<LinkPreviewModel>(),
        },
        {
          provide: LINK_PREVIEW_FACTORY_TOKEN,
          useValue: createMock<LinkPreviewFactory>(),
        },
        {
          provide: Sequelize,
          useValue: createMock<Sequelize>(),
        },
      ],
    }).compile();

    repo = module.get<ILinkPreviewRepository>(LinkPreviewRepository);
    linkPreViewModel = module.get<LinkPreviewModel>(getModelToken(LinkPreviewModel));
    linkPreviewFactory = module.get<LinkPreviewFactory>(LINK_PREVIEW_FACTORY_TOKEN);
    sequelizeConnection = module.get<Sequelize>(Sequelize);
    sequelizeConnection.transaction.mockResolvedValue(transaction);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create link preview model success', () => {
    const spy = jest.spyOn(linkPreViewModel, 'create');
    repo.create(mockLinkPreviewEntity);
    expect(spy).toBeCalledWith(mockLinkPreviewRecord);
  });

  it('should update link preview model success', () => {
    const spy = jest.spyOn(linkPreViewModel, 'update');
    repo.update(mockLinkPreviewEntity);
    expect(spy).toBeCalledWith(mockLinkPreviewRecord, {
      where: {
        id: mockLinkPreviewEntity.get('id'),
      },
    });
  });

  describe('findByUrl', () => {
    it('should find link preview model success', async () => {
      const spy = jest.spyOn(linkPreViewModel, 'findOne').mockResolvedValue({
        toJSON: () => mockLinkPreviewRecord,
      });
      const spyReconstitute = jest
        .spyOn(linkPreviewFactory, 'reconstitute')
        .mockResolvedValue(mockLinkPreviewEntity);
      const result = await repo.findByUrl(mockLinkPreviewEntity.get('url'));

      expect(spy).toBeCalledWith({
        where: {
          url: mockLinkPreviewEntity.get('url'),
        },
      });
      expect(spyReconstitute).toBeCalledWith(mockLinkPreviewRecord);
      expect(result).toEqual(mockLinkPreviewEntity);
    });

    it('should find link preview model null', async () => {
      const spy = jest.spyOn(linkPreViewModel, 'findOne').mockResolvedValue(null);

      const result = await repo.findByUrl(mockLinkPreviewEntity.get('url'));

      expect(spy).toBeCalledWith({
        where: {
          url: mockLinkPreviewEntity.get('url'),
        },
      });
      expect(result).toBeNull();
    });
  });
});
