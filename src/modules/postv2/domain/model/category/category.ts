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

export class Category extends AggregateRoot {
  private _id: string;
  private _parentId: string;
  private _name: string;
  private _level: number;
  private _zindex: number;
  private _isActive: boolean;
  private _createdBy: string;
  private _updatedBy: string;
  private _slug: string;
  private _createdAt: Date;
  private _updatedAt: Date;

  public constructor(properties: CategoryProperties) {
    super();
    Object.assign(this, properties);
  }

  public get id(): string {
    return this._id;
  }

  public get parentId(): string {
    return this._parentId;
  }

  public get name(): string {
    return this._name;
  }

  public get slug(): string {
    return this._slug;
  }
}
