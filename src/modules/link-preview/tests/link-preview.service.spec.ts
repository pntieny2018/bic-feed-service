import { Test, TestingModule } from '@nestjs/testing';
import { Sequelize } from 'sequelize-typescript';
import { getModelToken } from '@nestjs/sequelize';
import { LinkPreviewModel } from '../../../database/models/link-preview.model';
import { PostLinkPreviewModel } from '../../../database/models/post-link-preview.model';
import { LinkPreviewService } from '../link-preview.service';
import { linkPreviewDtoMock } from './mock/link-preview-dto.mock';
import { mockedPostData } from '../../post/test/mocks/response/post.response.mock';

describe('LinkPreviewService', () => {

  let linkPreviewService;
  let linkPreviewModel;
  let postLinkPreviewModel;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinkPreviewService,
        {
          provide: Sequelize,
          useValue: {
            query: jest.fn(),
            transaction: jest.fn(async () => ({
              commit: jest.fn(),
              rollback: jest.fn(),
            })),
            escape: jest.fn(),
          },
        },
        {
          provide: getModelToken(LinkPreviewModel),
          useValue: {
            findOne: jest.fn(),
            findAndCountAll: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
            destroy: jest.fn(),
            findByPk: jest.fn(),
            findOrCreate: jest.fn(),
            bulkCreate: jest.fn(),
          },
        },
        {
          provide: getModelToken(PostLinkPreviewModel),
          useValue: {
            findOne: jest.fn(),
            findAndCountAll: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
            destroy: jest.fn(),
            findByPk: jest.fn(),
            findOrCreate: jest.fn(),
            bulkCreate: jest.fn(),
          },
        },
      ],
    }).compile();

    linkPreviewService = module.get<LinkPreviewService>(LinkPreviewService);
    linkPreviewModel = module.get<typeof LinkPreviewModel>(getModelToken(LinkPreviewModel));
    postLinkPreviewModel = module.get<typeof PostLinkPreviewModel>(getModelToken(PostLinkPreviewModel));
  });

  it('should be defined', () => {
    expect(linkPreviewService).toBeDefined();
  });

  const postId = 'ad97caa1-4f1a-4f01-8140-275aa3fc6760';

  describe('upsert', () => {
    it('should success', async () => {
      linkPreviewModel.findOne.mockResolvedValue(null);
      linkPreviewModel.create.mockResolvedValue(linkPreviewDtoMock);
      await linkPreviewService.upsert(linkPreviewDtoMock, postId);
      expect(linkPreviewModel.findOne).toBeCalled();
      expect(linkPreviewModel.create).toBeCalled();
      expect(postLinkPreviewModel.findOne).toBeCalled();
      expect(postLinkPreviewModel.create).toBeCalled()
    });

    it('should destroy if linkPreviewDto=null', async () => {
      postLinkPreviewModel.findOne.mockResolvedValue({postId: postId, linkPreviewId: linkPreviewDtoMock.id, linkPreview: linkPreviewDtoMock});
      await linkPreviewService.upsert(null, postId);
      expect(postLinkPreviewModel.destroy).toBeCalled()
    })
  });

  describe('bindToPosts', () => {
    it('should success', async () => {
      const post = mockedPostData;
      postLinkPreviewModel.findAll.mockResolvedValue([{postId: post.id, linkPreviewId: linkPreviewDtoMock.id, linkPreview: linkPreviewDtoMock}]);
      await linkPreviewService.bindToPosts([post]);
      expect(postLinkPreviewModel.findAll).toBeCalled()
    })
  })
});
