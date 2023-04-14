import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ExternalService } from '../../../app/external.service';
import { REQUEST_CONTEXT } from '../../../common/interceptors/user.interceptor';
import { MediaModel } from '../../../database/models/media.model';
import { MediaDto } from '../dto';
import { UserDto } from '../../v2-user/application';
import { MediaStatus } from '../../v2-post/data-type';

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
    private _externalService: ExternalService,
    @InjectModel(MediaModel) private _mediaModel: typeof MediaModel
  ) {}

  public async validate(media: MediaDto, args?: IExtendedValidationArguments): Promise<boolean> {
    const fileIds = media.files.map((i) => i.id);
    const user = args?.object[REQUEST_CONTEXT].user;
    if (fileIds.length > 0) {
      const files = await this._externalService.getFileIds(fileIds);
      if (files.length < fileIds.length) {
        return false;
      }
      if (!files.every((file) => file.createdBy !== user.id)) return false;
      media.files = files;
    }

    const videoIds = media.videos.map((i) => i.id);
    if (videoIds.length > 0) {
      const videos = await this._externalService.getVideoIds(videoIds);
      if (videos.length < videoIds.length) {
        return false;
      }
      if (!videos.every((video) => video.createdBy !== user.id)) return false;
      media.videos = videos;
    }

    const imageIds = media.images.map((i) => i.id);
    if (imageIds.length > 0) {
      const images = await this._externalService.getImageIds(videoIds);
      if (images.length < imageIds.length) {
        return false;
      }
      if (
        !images.every(
          (image) => image.createdBy !== user.id || image.status !== MediaStatus.COMPLETED
        )
      )
        return false;
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
