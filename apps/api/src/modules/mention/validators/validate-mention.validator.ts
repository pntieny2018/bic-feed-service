import { IUserService, USER_SERVICE_TOKEN, UserDto } from '@libs/service/user';
import { Inject, Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

import { REQUEST_CONTEXT } from '../../../common/interceptors/user.interceptor';

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
export class ValidateMentionConstraint implements ValidatorConstraintInterface {
  public constructor(
    @Inject(USER_SERVICE_TOKEN)
    private _userAppService: IUserService
  ) {}

  public async validate(mentions: string[], args?: ValidationArguments): Promise<boolean> {
    if (mentions.length === 0) {
      return true;
    }

    const { groupIds } = args.object['audience'];

    const users = await this._userAppService.findAllByIds(mentions);

    for (const user of users) {
      if (!groupIds.some((groupId) => user.groups.includes(groupId))) {
        return false;
      }
    }
    return true;
  }

  public defaultMessage(args: ValidationArguments): string {
    return `Invalid mention`;
  }
}
export function ValidateMention(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string): void {
    registerDecorator({
      name: 'ValidateMention',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: ValidateMentionConstraint,
    });
  };
}
