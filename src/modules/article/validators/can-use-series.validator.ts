import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';
import { REQUEST_CONTEXT } from '../../../common/interceptors/user.interceptor';
import { CategoryModel } from '../../../database/models/category.model';
import { SeriesModel } from '../../../database/models/series.model';
import { UserDto } from '../../auth';

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
  public constructor(@InjectModel(CategoryModel) private _seriesModel: typeof SeriesModel) {}

  public async validate(
    seriesIds: string[],
    args?: IExtendedValidationArguments
  ): Promise<boolean> {
    if (seriesIds.length === 0) return true;
    const user = args?.object[REQUEST_CONTEXT].user;
    const seriesCount = await this._seriesModel.count({
      where: {
        id: seriesIds,
        createdBy: user.id,
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
