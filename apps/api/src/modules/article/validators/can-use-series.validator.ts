import { UserDto } from '@libs/service/user';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

import { REQUEST_CONTEXT } from '../../../common/interceptors/user.interceptor';
import { PostModel } from '../../../database/models/post.model';

export interface IExtendedValidationArguments extends ValidationArguments {
  object: {
    [REQUEST_CONTEXT]: {
      user: UserDto;
      token: string;
    };
  };
}

@ValidatorConstraint({ async: true })
@Injectable()
export class CanUseSeriesConstraint implements ValidatorConstraintInterface {
  public constructor(@InjectModel(PostModel) private _postModel: typeof PostModel) {}

  public async validate(
    seriesIds: string[],
    args?: IExtendedValidationArguments
  ): Promise<boolean> {
    if (seriesIds.length === 0) {
      return true;
    }
    const user = args?.object[REQUEST_CONTEXT].user;
    const seriesCount = await this._postModel.count({
      where: {
        id: seriesIds,
        createdBy: user.id,
        //Check audience
      },
    });
    if (seriesCount < seriesIds.length) {
      return false;
    }
    return true;
  }

  public defaultMessage(args: ValidationArguments): string {
    return `Invalid series`;
  }
}
export function CanUseSeries(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string): void {
    registerDecorator({
      name: 'CanUseSeries',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: CanUseSeriesConstraint,
    });
  };
}
