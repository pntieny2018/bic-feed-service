import { UnprocessableEntityException } from '@nestjs/common';
import { AggregateRoot } from '@nestjs/cqrs';
import { StringHelper } from '../../../../common/helpers';

export type TagEssentialProperties = Readonly<
  Required<{
    id: string;
    groupId: string;
    name: string;
    createdBy: string;
  }>
>;

export type TagOptionalProperties = Readonly<
  Partial<{
    updatedBy: string;
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
  private _isChanged: boolean;

  public constructor(properties: TagEssentialProperties) {
    super();
    const { id, groupId, name, createdBy } = properties;
    this._id = id;
    this._groupId = groupId;
    this._name = name.trim().toLowerCase();
    this._slug = StringHelper.convertToSlug(name);
    this._totalUsed = 0;
    this._createdBy = createdBy;
    this._updatedBy = createdBy;
    this._createdAt = new Date();
    this._updatedAt = new Date();
    this._isChanged = false;
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

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public get isChanged(): boolean {
    return this._isChanged;
  }

  public increaseTotalUsed(): void {
    this._totalUsed += 1;
  }

  public update(properties: Partial<TagProperties>): void {
    if (!this._name) {
      throw new Error('Tag name is required');
    }
    if (this._totalUsed > 0) {
      throw new Error('i18n error');
    }
    const name = properties.name.trim().toLowerCase();
    if (name === this._name) return;
    this._name = properties.name;
    this._updatedBy = properties.updatedBy;
    this._slug = StringHelper.convertToSlug(properties.name);
    this._isChanged = true;
  }

  public delete(): void {
    if (this._totalUsed > 0) {
      throw new UnprocessableEntityException('i18n error');
    }
  }
}
