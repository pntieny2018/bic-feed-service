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
  private _updatedBy: string;
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

  public constructor(properties: MediaEssentialProperties & MediaOptionalProperties) {
    super();
    const {
      id,
      url,
      name,
      type,
      createdBy,
      originName,
      mimeType,
      width,
      height,
      size,
      extension,
      status,
      thumbnails,
    } = properties;
    this._id = id;
    this._url = url;
    this._name = name;
    this._type = type;
    this._status = status;
    this._originName = originName;
    this._mimeType = mimeType;
    this._width = width ?? 0;
    this._height = height ?? 0;
    this._size = size ?? 0;
    this._extension = extension;
    this._createdBy = createdBy;
    this._updatedBy = createdBy;
    this._thumbnails = thumbnails ?? null;
    this._createdAt = new Date();
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
  //  this.isDraft = false;
  }
}
