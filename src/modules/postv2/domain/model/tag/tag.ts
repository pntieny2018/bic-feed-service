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

export interface ITag {
  increaseTotalUsed: () => void;
  update: (properties: TagProperties) => void;
  delete: () => void;
  commit: () => void;
}
export class Tag extends AggregateRoot implements ITag {
  public id: string;
  public groupId: string;
  public name: string;
  public createdBy: string;
  public updatedBy: string;
  public slug: string;
  public createdAt: Date;
  public updatedAt: Date;
  public totalUsed: number;

  public constructor(properties: TagProperties) {
    super();
    Object.assign(this, properties);
  }

  public increaseTotalUsed(): void {
    this.totalUsed += 1;
  }

  public update(properties: TagProperties): void {
    this.name = properties.name;
    this.slug = StringHelper.convertToSlug(properties.name);
  }

  public delete(): void {
    if (this.totalUsed > 0) {
      throw new UnprocessableEntityException('i18n error');
    }
  }
}
