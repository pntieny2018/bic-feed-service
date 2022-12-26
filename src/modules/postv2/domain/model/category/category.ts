import { AggregateRoot } from '@nestjs/cqrs';

export type CategoryEssentialProperties = Readonly<
  Required<{
    id: string;
    parentId: string;
    name: string;
    level: number;
    zindex: number;
    isActive: boolean;
    createdBy: string;
    updatedBy: string;
  }>
>;

export type CategoryOptionalProperties = Readonly<
  Partial<{
    slug: string;
    createdAt: Date;
    updatedAt: Date;
  }>
>;

export type CategoryProperties = CategoryEssentialProperties & Required<CategoryOptionalProperties>;

export interface ICategory {
  commit: () => void;
}
export class CategoryImplement extends AggregateRoot implements ICategory {
  public id: string;
  public parentId: string;
  public name: string;
  public level: number;
  public zindex: number;
  public isActive: boolean;
  public createdBy: string;
  public updatedBy: string;
  public slug: string;
  public createdAt: Date;
  public updatedAt: Date;

  public constructor(properties: CategoryProperties) {
    super();
    Object.assign(this, properties);
  }
}
