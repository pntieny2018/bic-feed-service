import { Inject, Injectable } from '@nestjs/common';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';
import { REQUEST_CONTEXT } from '../../../common/interceptors/user.interceptor';
import { GroupService } from '../../../shared/group';
import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
  UserDto,
} from '../../v2-user/application';

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
    @Inject(USER_APPLICATION_TOKEN)
    private _userAppService: IUserApplicationService,
    private _groupService: GroupService
  ) {}

  public async validate(mentions: string[], args?: ValidationArguments): Promise<boolean> {
    if (mentions.length === 0) return true;

    const { groupIds } = args.object['audience'];

    const users = await this._userAppService.findAllByIds(mentions);

    for (const user of users) {
      if (!this._groupService.isMemberOfSomeGroups(groupIds, user.groups)) {
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
