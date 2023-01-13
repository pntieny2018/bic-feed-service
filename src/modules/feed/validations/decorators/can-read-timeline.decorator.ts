import { SentryService } from '@app/sentry';
import { Injectable, Logger } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { UserService } from '../../../../shared/user';
import { UserDto } from '../../../auth';

const VALIDATOR_CONSTRAINT_NAME = 'CanReadTimelineConstraint';

@Injectable()
@ValidatorConstraint({ name: VALIDATOR_CONSTRAINT_NAME, async: true })
export class CanReadTimelineConstraint implements ValidatorConstraintInterface {
  private readonly _logger = new Logger(CanReadTimelineConstraint.name);

  public constructor(
    private readonly _userService: UserService,
    private readonly _sentryService: SentryService
  ) {}

  public defaultMessage(): string {
    return "Group's timeline not found";
  }

  public async validate(groupId: string, args?: ValidationArguments): Promise<boolean> {
    const userDto: UserDto = args.object['user'];
    try {
      const userSharedDto = await this._userService.get(userDto.id);
      return userSharedDto.groups.includes(groupId);
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      this._sentryService.captureException(e);
      return false;
    }
  }
}

export function CanReadTimeline(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): any {
    registerDecorator({
      name: 'CanReadTimeline',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: CanReadTimelineConstraint,
    });
  };
}
