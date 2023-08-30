import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosHelper } from '../../common/helpers';
import { lastValueFrom } from 'rxjs';
import { ENDPOINT } from '../../common/constants/endpoint.constant';

type SpecificNotificationSettings = {
  userId: string;
  targetId: string;
  enable: boolean;
};

@Injectable()
export class ContentNotificationService {
  private readonly _logger = new Logger(ContentNotificationService.name);

  public constructor(private readonly _httpService: HttpService) {}

  public async getSpecificNotificationSettings(
    userId: string,
    targetId: string
  ): Promise<SpecificNotificationSettings> {
    try {
      const response = await lastValueFrom(
        this._httpService.get(
          AxiosHelper.injectParamsToStrUrl(
            ENDPOINT.NOTIFICATION.INTERNAL.SPECIFIC_NOTIFICATION_SETTINGS,
            {
              userId,
              targetId,
            }
          )
        )
      );
      return AxiosHelper.getDataResponse<SpecificNotificationSettings>(response);
    } catch (e) {
      this._logger.debug(e);
    }
  }
}
