import { AggregateRoot } from '@nestjs/cqrs';
import { MediaStatus, MediaType } from '../../../data-type';

export type MediaEssentialProperties = Readonly<
  Required<{
    id: string;
    createdBy: string;
    url: string;
    type: MediaType;
  }>
>;

export type MediaOptionalProperties = Readonly<
  Partial<{
    createdAt?: Date;
    name: string;
    originName?: string;
    width?: number;
    height?: number;
    extension?: string;
    status: MediaStatus;
    size?: number;
    mimeType?: string;
    thumbnails?: {
      width: number;
      height: number;
      url: string;
    }[];
  }>
>;

export type MediaProperties = MediaEssentialProperties & Required<MediaOptionalProperties>;

export class Media extends AggregateRoot {
  private _id: string;
  private _createdBy: string;
  private _url: string;
  private _type: MediaType;
  private _createdAt?: Date;
  private _name: string;
  private _originName?: string;
  private _width?: number;
  private _height?: number;
  private _extension?: string;
  private _status: MediaStatus;
  private _size?: number;
  private _mimeType?: string;
  private _thumbnails?: {
    width: number;
    height: number;
    url: string;
  }[];

  public constructor(properties: MediaProperties) {
    super();
    const { id, url, name, type, createdBy } = properties;
    this._id = id;
    this._groupId = groupId;
    this._name = name.trim().toLowerCase();
    this._slug = StringHelper.convertToSlug(name);
    this._totalUsed = 0;
    this._createdBy = createdBy;
    this._updatedBy = updatedBy;
    this._createdAt = new Date();
    this._updatedAt = new Date();
    this._isChanged = false;
  }

  public get id(): string {
    return this._id;
  }

  public get url(): string {
    return this.url;
  }

  public get createdBy(): string {
    return this._createdBy;
  }

  public get name(): string {
    return this._name;
  }

  public get type(): string {
    return this._type;
  }

  public get mimeType(): string {
    return this._mimeType;
  }


  public get status(): string {
    return this._status;
  }


  public update(): void {
    this.isDraft = false;
  }

  public publish(): void {
    this.isDraft = false;
  }
}
