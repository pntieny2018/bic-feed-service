import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { COMMUNITY_ADMIN_PATH } from '../../common/constants';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';

@Injectable()
export class GroupHttpService {
  private readonly _logger = new Logger(GroupHttpService.name);

  public constructor(private readonly _httpService: HttpService) {}

  public async getAdminIds(rootGroupIds: string[]): Promise<Record<string, string[]>> {
    try {
      const params = {
        ['root_group_ids']: rootGroupIds,
        offset: 0,
        limit: 50,
      };
      const response = await lastValueFrom(
        this._httpService.get(COMMUNITY_ADMIN_PATH, {
          params: params,
        })
      );
      if (response.status !== HttpStatus.OK) {
        return null;
      }
      return response.data['data'];
    } catch (ex) {
      this._logger.error(ex);
      return null;
    }
  }
}
