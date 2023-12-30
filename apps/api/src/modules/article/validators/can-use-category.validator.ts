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
import { Op } from 'sequelize';

import { REQUEST_CONTEXT } from '../../../common/interceptors/user.interceptor';
import { CategoryModel } from '../../../database/models/category.model';

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
export class CanUseCategoryConstraint implements ValidatorConstraintInterface {
  public constructor(@InjectModel(CategoryModel) private _categoryModel: typeof CategoryModel) {}

  public async validate(
    categoryIds: string[],
    args?: IExtendedValidationArguments
  ): Promise<boolean> {
    if (categoryIds.length === 0) {
      return true;
    }
    const user = args?.object[REQUEST_CONTEXT].user;
    const totalCatesCanAccessFromCateIds = await this._categoryModel.count({
      where: {
        id: categoryIds,
        [Op.or]: {
          level: 1,
          createdBy: user.id,
        },
      },
    });
    if (totalCatesCanAccessFromCateIds < categoryIds.length) {
      return false;
    }
    return true;
  }

  public defaultMessage(args: ValidationArguments): string {
    return `Invalid categories`;
  }
}
export function CanUseCategory(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string): void {
    registerDecorator({
      name: 'CanUseCategory',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: CanUseCategoryConstraint,
    });
  };
}
