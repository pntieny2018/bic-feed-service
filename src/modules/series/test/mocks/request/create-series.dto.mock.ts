import { CreateSeriesDto } from '../../../dto/requests';

export const mockedCreateSeriesDto: CreateSeriesDto = {
  name: 'crypto',
  active: true,
};

export const mockedSeriesCreated = {
  id: 'ad70928e-cffd-44a9-9b27-19faa7210530',
  name: 'crypto mock',
  slug: 'crypto-mock',
  active: true,
  createdBy: 1,
  updatedBy: 1,
  updatedAt: new Date('2022-05-19T07:31:55.504Z'),
  createdAt: new Date('2022-05-19T07:31:55.504Z'),
  totalArticle: 0,
  totalView: 0,
};
