import { ICategory } from '../../../../database/models/category.model';
import { v4 } from 'uuid';

export const categoryRecord: ICategory = {
  id: v4(),
  parentId: '00000000-0000-0000-0000-000000000000',
  name: 'Category 1',
  slug: 'category-1',
  level: 1,
  zindex: 1,
  isActive: true,
  updatedBy: '001072e1-d214-4d3d-beab-8a5bb8784cc4',
  createdBy: '001072e1-d214-4d3d-beab-8a5bb8784cc4',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const categoryRecord2: ICategory = {
  id: v4(),
  parentId: '00000000-0000-0000-0000-000000000000',
  name: 'Category 2',
  slug: 'category-2',
  level: 1,
  zindex: 1,
  isActive: true,
  updatedBy: '001072e1-d214-4d3d-beab-8a5bb8784cc4',
  createdBy: '001072e1-d214-4d3d-beab-8a5bb8784cc4',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const categoryRecords: ICategory[] = [categoryRecord, categoryRecord2];
