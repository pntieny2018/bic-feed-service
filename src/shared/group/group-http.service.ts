import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { COMMUNITY_ADMIN_PATH, GROUP_ADMIN_PATH } from '../../common/constants';
import { UserSharedDto } from '../user/dto';

@Injectable()
export class GroupHttpService {
  private readonly _logger = new Logger(GroupHttpService.name);

  public constructor(private readonly _httpService: HttpService) {}

  public async getGroupAdminIds(
    actor: UserSharedDto,
    groupIds: string[],
    offset = 0,
    limit = 50
  ): Promise<string[]> {
    const response: string[][] = await Promise.all(
      groupIds.map(async (groupId): Promise<string[]> => {
        try {
          const response = await lastValueFrom(
            this._httpService.get(GROUP_ADMIN_PATH.replace(':groupId', groupId), {
              headers: {
                user: JSON.stringify({
                  ['token_use']: 'id',
                  ['custom:user_uuid']: actor.id,
                  ['email']: actor.email,
                }),
              },
              params: {
                offset: offset,
                limit: limit,
              },
            })
          );

          if (response.status !== HttpStatus.OK) {
            return [];
          }
          this._logger.debug(JSON.stringify(response.data));

          const admins = response.data['data']['group_admin']['data'];

          return admins.map((admin) => admin.id);
        } catch (ex) {
          return [];
        }
      })
    );
    return response.flat();
  }

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
      this._logger.debug(JSON.stringify(response.data));
      return response.data['data'];
    } catch (ex) {
      this._logger.error(JSON.stringify(ex));
      return {
        admins: {},
        owners: {},
      };
    }
  }
}
