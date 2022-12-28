import { UnprocessableEntityException } from '@nestjs/common';
import { AggregateRoot } from '@nestjs/cqrs';
import { StringHelper } from '../../../../../common/helpers';

export type TagEssentialProperties = Readonly<
  Required<{
    id: string;
    groupId: string;
    name: string;
    createdBy: string;
    updatedBy: string;
  }>
>;

export type TagOptionalProperties = Readonly<
  Partial<{
    slug: string;
    createdAt: Date;
    updatedAt: Date;
    totalUsed: number;
  }>
>;

export type TagProperties = TagEssentialProperties & Required<TagOptionalProperties>;

export class Tag extends AggregateRoot {
  private _id: string;
  private _groupId: string;
  private _name: string;
  private _createdBy: string;
  private _updatedBy: string;
  private _slug: string;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _totalUsed: number;

  public constructor(properties: TagProperties) {
    super();
    Object.assign(this, properties);
  }

  public get id(): string {
    return this._id;
  }

  public get name(): string {
    return this._name;
  }

  public get groupId(): string {
    return this._groupId;
  }

  public get totalUsed(): number {
    return this._totalUsed;
  }

  public get slug(): string {
    return this._slug;
  }

  public get createdBy(): string {
    return this._createdBy;
  }

  public get updatedBy(): string {
    return this._updatedBy;
  }

  public increaseTotalUsed(): void {
    this._totalUsed += 1;
  }

  public update(properties: Partial<TagProperties>): void {
    if (this._totalUsed > 0) {
      throw new UnprocessableEntityException('i18n error');
    }
    this._name = properties.name;
    this._updatedBy = properties.updatedBy;
    this._slug = StringHelper.convertToSlug(properties.name);
  }

  public delete(): void {
    if (this._totalUsed > 0) {
      throw new UnprocessableEntityException('i18n error');
    }
  }
}
