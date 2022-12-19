import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { COMMUNITY_ADMIN_PATH } from '../../common/constants';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';

@Injectable()
export class GroupHttpService {
  private readonly _logger = new Logger(GroupHttpService.name);

  public constructor(private readonly _httpService: HttpService) {}

  public async getAdminIds(
    rootGroupIds: string[],
    offset = 0,
    limit = 50
  ): Promise<{
    admins: Record<string, string[]>;
    owners: Record<string, string[]>;
  }> {
    try {
      const params = `root_group_ids=${rootGroupIds.join(',')}&offset=${offset}&limit=${limit}`;

      const response = await lastValueFrom(
        this._httpService.get(`${COMMUNITY_ADMIN_PATH}?${params}`)
      );
      if (response.status !== HttpStatus.OK) {
        return {
          admins: {},
          owners: {},
        };
      }
      this._logger.debug(response.data);
      return response.data['data'];
    } catch (ex) {
      this._logger.error(ex);
      return {
        admins: {},
        owners: {},
      };
    }
  }
}
