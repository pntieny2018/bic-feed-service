import { lastValueFrom } from 'rxjs';
import { UserSharedDto } from './dto';
import { HttpService } from '@nestjs/axios';
import { AxiosHelper } from '../../common/helpers';
import { plainToInstance } from 'class-transformer';
import { BIC_GROUP_API } from '../../common/constants';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';

@Injectable()
export class UserHttpService {
  private readonly _logger = new Logger(UserHttpService.name);
  public constructor(private readonly _httpService: HttpService) {}

  public async getUserInfo(username: string): Promise<UserSharedDto> {
    try {
      const response = await lastValueFrom(
        this._httpService.get(
          AxiosHelper.injectParamsToStrUrl(BIC_GROUP_API.USER_INFO, {
            username: username,
          })
        )
      );
      if (response.status !== HttpStatus.OK) {
        return null;
      }
      const userRaw = AxiosHelper.getDataResponse<object>(response);

      return plainToInstance(UserSharedDto, userRaw);
    } catch (ex) {
      this._logger.debug(ex);
      return null;
    }
  }
}
