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
import { CoverMediaDto } from '../../article/dto/requests';
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
export class ValidateCoverConstraint implements ValidatorConstraintInterface {
  public constructor(
    private _externalService: ExternalService,
    @InjectModel(MediaModel) private _mediaModel: typeof MediaModel
  ) {}

  public async validate(
    cover: CoverMediaDto,
    args?: IExtendedValidationArguments
  ): Promise<boolean> {
    const user = args?.object[REQUEST_CONTEXT].user;
    const id = cover.id;
    const images = await this._externalService.getImageIds([id]);
    if (images.length === 0) {
      return false;
    }
    if (images[0].createdBy !== user.id) return false;
    if (images[0].status !== MediaStatus.COMPLETED) return false;

    cover = images[0];

    return true;
  }

  public defaultMessage(_args: ValidationArguments): string {
    return `Invalid cover id`;
  }
}

export function ValidateCover(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string): void {
    registerDecorator({
      name: 'ValidateCover',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: ValidateCoverConstraint,
    });
  };
}
