import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ArrayHelper, AxiosHelper } from 'apps/api/src/common/helpers';
import { RedisService } from '@app/infra/redis';
import { CACHE_KEYS } from 'apps/api/src/common/constants';
import { IGroup, IGroupMember, IGroupService } from '@app/service/group/src/interface';
import { GROUP_AXIOS_TOKEN, IHttpAdapter } from '@app/infra/http';
import { IUser } from '@app/service/user/src/interfaces';
import { GROUP_ENDPOINT } from './endpoint.constant';

@Injectable()
export class GroupService implements IGroupService {
  private readonly _logger = new Logger(GroupService.name);

  public constructor(
    private _store: RedisService,
    @Inject(GROUP_AXIOS_TOKEN) private _httpService: IHttpAdapter
  ) {}

  public async findById(groupId: string): Promise<IGroup> {
    let group = await this._store.get<IGroup>(`${CACHE_KEYS.SHARE_GROUP}:${groupId}`);
    if (group === null) {
      const response = await this._httpService.get<IGroup[]>(
        AxiosHelper.injectParamsToStrUrl(GROUP_ENDPOINT.INTERNAL.GROUPS_PATH, {
          ids: groupId,
        })
      );

      if (response.status === HttpStatus.OK) {
        group = response.data['data'][0];
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
      const response = await this._httpService.get<IGroup[]>(
        AxiosHelper.injectParamsToStrUrl(GROUP_ENDPOINT.INTERNAL.GROUPS_PATH, {
          ids: notFoundGroupIds.join(','),
        })
      );
      if (response.status === HttpStatus.OK) {
        groups = groups.concat(response.data['data']);
      }
    }
    return groups;
  }

  public async getGroupMembersDividedByRole(
    actor: IUser,
    groupIds: string[],
    pagination?: { offset?: number; limit?: number }
  ) {
    const response = await Promise.all(
      groupIds.map(async (groupId): Promise<IGroupMember[]> => {
        try {
          const response = await this._httpService.get(
            GROUP_ENDPOINT.GROUP_ADMIN_PATH.replace(':groupId', groupId),
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
                offset: pagination?.offset || 0,
                limit: pagination?.limit || 50,
              },
            }
          );

          if (response.status !== HttpStatus.OK) {
            return [];
          }

          return response.data['data'];
        } catch (ex) {
          return [];
        }
      })
    );
    return [...new Set(response.flat())];
  }

  public async getCommunityAdmins(
    rootGroupIds: string[],
    pagination?: { offset?: number; limit?: number }
  ): Promise<{
    admins: Record<string, string[]>;
    owners: Record<string, string[]>;
  }> {
    try {
      const offset = pagination?.offset || 0;
      const limit = pagination?.limit || 50;
      const params = `group_ids=${rootGroupIds.join(',')}&offset=${offset}&limit=${limit}`;

      const response = await this._httpService.get(
        `${GROUP_ENDPOINT.INTERNAL.COMMUNITY_ADMIN_PATH}?${params}`
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
