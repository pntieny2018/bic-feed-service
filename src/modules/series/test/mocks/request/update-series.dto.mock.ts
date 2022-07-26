import { UpdateSeriesDto } from '../../../dto/requests';

export const mockedUpdateSeriesDto: UpdateSeriesDto = {
  name: 'crypto mock update',
  isActive: true,
};

export const mockedSeriesUpdated = {
  id: 'ad70928e-cffd-44a9-9b27-19faa7210530',
  name: 'crypto mock update',
  slug: 'crypto-mock-update',
  isActive: true,
  createdBy: '43f306ba-a89f-4d43-8ee8-4d51fdcd4b13',
  updatedBy: '43f306ba-a89f-4d43-8ee8-4d51fdcd4b13',
  updatedAt: new Date('2022-05-19T07:31:55.504Z'),
  createdAt: new Date('2022-05-19T07:31:55.504Z'),
  totalArticle: 0,
  totalView: 0,
};
