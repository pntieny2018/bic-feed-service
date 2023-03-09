import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';
import { ExternalService } from '../../../app/external.service';
import { REQUEST_CONTEXT } from '../../../common/interceptors/user.interceptor';
import { MediaModel } from '../../../database/models/media.model';
import { MediaDto } from '../dto';
import { UserDto } from '../../v2-user/application';

export interface IExtendedValidationArguments extends ValidationArguments {
  object: {
    [REQUEST_CONTEXT]: {
      user: UserDto;
      token: string;
      userPayload: string;
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
    const token = args?.object[REQUEST_CONTEXT].token;
    const user = args?.object[REQUEST_CONTEXT].user;
    const userPayload = args?.object[REQUEST_CONTEXT].userPayload;
    if (fileIds.length > 0) {
      const files = await this._externalService.getFileIds(fileIds, token, userPayload);
      if (files.length < fileIds.length) {
        return false;
      }
      media.files = files;
    }

    const videoIds = media.videos.map((i) => i.id);
    if (videoIds.length > 0) {
      const videos = await this._externalService.getVideoIds(videoIds, token, userPayload);
      if (videos.length < videoIds.length) {
        return false;
      }
      media.videos = videos;
    }

    const imageIds = media.images.map((i) => i.id);
    if (imageIds.length > 0) {
      const images = await this._mediaModel.findAll({
        where: {
          id: imageIds,
          createdBy: user.id,
        },
      });
      if (images.length < imageIds.length) {
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
