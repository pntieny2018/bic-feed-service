import { IMediaService, MEDIA_SERVICE_TOKEN } from '@libs/service/media/src/interface';
import { Inject, Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

import { REQUEST_CONTEXT } from '../../../common/interceptors/user.interceptor';
import { UserDto } from '../../v2-user/application';
import { MediaDto } from '../dto';

export interface IExtendedValidationArguments extends ValidationArguments {
  object: {
    [REQUEST_CONTEXT]: {
      user: UserDto;
    };
  };
}

@ValidatorConstraint({ async: true })
@Injectable()
export class ValidateMediaConstraint implements ValidatorConstraintInterface {
  public constructor(
    @Inject(MEDIA_SERVICE_TOKEN)
    private readonly _mediaService: IMediaService
  ) {}

  public async validate(media: MediaDto, args?: IExtendedValidationArguments): Promise<boolean> {
    const fileIds = media.files.map((i) => i.id);
    const user = args?.object[REQUEST_CONTEXT].user;
    if (fileIds.length > 0) {
      const files = await this._mediaService.findFilesByIds(fileIds);
      if (files.length < fileIds.length) {
        return false;
      }
      if (files.some((file) => file.createdBy !== user.id)) {
        return false;
      }
      media.files = files;
    }

    const videoIds = media.videos.map((i) => i.id);
    if (videoIds.length > 0) {
      const videos = await this._mediaService.findVideosByIds(videoIds);
      if (videos.length < videoIds.length) {
        return false;
      }
      if (videos.some((video) => video.createdBy !== user.id)) {
        return false;
      }
      media.videos = videos;
    }

    const imageIds = media.images.map((i) => i.id);
    if (imageIds.length > 0) {
      const images = await this._mediaService.findImagesByIds(imageIds);
      if (images.length < imageIds.length) {
        return false;
      }
      if (images.some((image) => image.createdBy !== user.id || image.status !== 'DONE')) {
        return false;
      }
      media.images = images;
    }

    return true;
  }

  public defaultMessage(_args: ValidationArguments): string {
    return `Invalid media id`;
  }
}
export function ValidateMedia(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string): void {
    registerDecorator({
      name: 'ValidateMedia',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: ValidateMediaConstraint,
    });
  };
}
