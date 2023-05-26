import { GroupDto } from '../../../../v2-group/application';
import { UserDto } from '../../../../v2-user/application';

export interface ISeriesValidator {
  checkCanCreateSeries(
    user: UserDto,
    groupAudiences: GroupDto[],
    needEnableSetting: boolean
  ): Promise<void>;
}

export const SERIES_VALIDATOR_TOKEN = 'SERIES_VALIDATOR_TOKEN';
