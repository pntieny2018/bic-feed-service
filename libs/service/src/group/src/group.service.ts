import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ArrayHelper, AxiosHelper } from 'apps/api/src/common/helpers';
import { ENDPOINT } from 'apps/api/src/common/constants/endpoint.constant';
import { RedisService } from '@app/infra/redis';
import { CACHE_KEYS } from 'apps/api/src/common/constants';
import { IGroup, IGroupService } from '@app/service/group/src/interface';
import { GROUP_AXIOS_TOKEN } from '@app/infra/http';
import { AxiosInstance } from 'axios';
import { IUser } from '@app/service/user/src/interfaces';

@Injectable()
export class GroupService implements IGroupService {
  private readonly _logger = new Logger(GroupService.name);

  public constructor(
    private _store: RedisService,
    @Inject(GROUP_AXIOS_TOKEN) private _httpService: AxiosInstance
  ) {}

  public async findOne(groupId: string): Promise<IGroup> {
    let group = await this._store.get<IGroup>(`${CACHE_KEYS.SHARE_GROUP}:${groupId}`);
    if (group === null) {
      const response = await this._httpService.get(
        AxiosHelper.injectParamsToStrUrl(ENDPOINT.GROUP.INTERNAL.GROUPS_PATH, {
          ids: groupId,
        })
      );

      if (response.status === HttpStatus.OK) {
        group = AxiosHelper.getDataArrayResponse<IGroup>(response)[0];
      }
      if (!group) {
        return null;
      }
    }
    return group;
  }

  public async findAllByIds(groupIds: string[]): Promise<IGroup[]> {
    if (!groupIds || groupIds?.length === 0) return [];
    const keys = [...new Set(ArrayHelper.arrayUnique(groupIds.map((id) => id)))].map(
      (groupId) => `${CACHE_KEYS.SHARE_GROUP}:${groupId}`
    );
    let groups = await this._store.mget(keys);
    const notFoundGroupIds = groupIds.filter((id) => !groups.find((group) => group?.id === id));
    if (notFoundGroupIds.length > 0) {
      const response = await this._httpService.get(
        AxiosHelper.injectParamsToStrUrl(ENDPOINT.GROUP.INTERNAL.GROUPS_PATH, {
          ids: notFoundGroupIds.join(','),
        })
      );
      if (response.status === HttpStatus.OK) {
        groups = groups.concat(AxiosHelper.getDataArrayResponse<IGroup>(response));
      }
    }
    return groups;
  }

  public async getGroupAdminIds(
    actor: IUser,
    groupIds: string[],
    offset = 0,
    limit = 50
  ): Promise<string[]> {
    const response: string[][] = await Promise.all(
      groupIds.map(async (groupId): Promise<string[]> => {
        try {
          //TODO: Need Group provide API for this
          const response = await this._httpService.get(
            ENDPOINT.GROUP.GROUP_ADMIN_PATH.replace(':groupId', groupId),
            {
              headers: {
                user: JSON.stringify({
                  ['token_use']: 'id',
                  ['cognito:username']: actor.username,
                  ['custom:user_uuid']: actor.id,
                  ['email']: actor.email,
                }),
              },
              params: {
                offset: offset,
                limit: limit,
              },
            }
          );

          if (response.status !== HttpStatus.OK) {
            return [];
          }

          const admins = response.data['data']['group_admin']['data'];
          return admins.map((admin) => admin.id);
        } catch (ex) {
          return [];
        }
      })
    );
    return [...new Set(response.flat())];
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
      const params = `group_ids=${rootGroupIds.join(',')}&offset=${offset}&limit=${limit}`;

      const response = await this._httpService.get(
        `${ENDPOINT.GROUP.INTERNAL.COMMUNITY_ADMIN_PATH}?${params}`
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
