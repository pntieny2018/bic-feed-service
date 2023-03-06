import { SentryService } from '@app/sentry';
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
  UserDto,
} from '../../../v2-user/application';

const VALIDATOR_CONSTRAINT_NAME = 'CanReadTimelineConstraint';

@Injectable()
@ValidatorConstraint({ name: VALIDATOR_CONSTRAINT_NAME, async: true })
export class CanReadTimelineConstraint implements ValidatorConstraintInterface {
  private readonly _logger = new Logger(CanReadTimelineConstraint.name);

  public constructor(
    @Inject(USER_APPLICATION_TOKEN)
    private readonly _userAppService: IUserApplicationService,
    private readonly _sentryService: SentryService
  ) {}

  public defaultMessage(): string {
    return "Group's timeline not found";
  }

  public async validate(groupId: string, args?: ValidationArguments): Promise<boolean> {
    const userDto: UserDto = args.object['user'];
    try {
      const userSharedDto = await this._userAppService.findOne(userDto.id);
      return userSharedDto.groups.includes(groupId);
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      this._sentryService.captureException(e);
      return false;
    }
  }
}
