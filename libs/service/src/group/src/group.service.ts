import { ROLE_TYPE } from '@beincom/constants';
import { CACHE_KEYS } from '@libs/common/constants';
import { ArrayHelper, AxiosHelper } from '@libs/common/helpers';
import { Traceable } from '@libs/common/modules/opentelemetry';
import { GROUP_HTTP_TOKEN, IHttpService } from '@libs/infra/http';
import { RedisService } from '@libs/infra/redis';
import { UserDto } from '@libs/service/user';
import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';

import { GROUP_ENDPOINT } from './endpoint.constant';
import { GroupDto, GroupMember } from './group.dto';
import {
  GetUserIdsInGroupsProps,
  CountUsersInGroupsProps,
  GetUserRoleInGroupsResult,
  IGroupService,
  GetPaginationGroupsMembersProps,
} from './group.service.interface';

@Traceable()
@Injectable()
export class GroupService implements IGroupService {
  private readonly _logger = new Logger(GroupService.name);

  public constructor(
    private readonly _store: RedisService,
    @Inject(GROUP_HTTP_TOKEN) private _httpService: IHttpService
  ) {}

  public async findById(groupId: string): Promise<GroupDto> {
    let group = await this._store.get<GroupDto>(`${CACHE_KEYS.SHARE_GROUP}:${groupId}`);
    if (group === null) {
      const response = await this._httpService.get<GroupDto[]>(
        AxiosHelper.injectParamsToStrUrl(GROUP_ENDPOINT.INTERNAL.SHARED_GROUPS, {
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

  public async findAllByIds(groupIds: string[]): Promise<GroupDto[]> {
    if (!groupIds || groupIds?.length === 0) {
      return [];
    }
    const keys = [...new Set(ArrayHelper.arrayUnique(groupIds.map((id) => id)))].map(
      (groupId) => `${CACHE_KEYS.SHARE_GROUP}:${groupId}`
    );
    let groups = await this._store.mget(keys);
    const notFoundGroupIds = groupIds.filter((id) => !groups.find((group) => group?.id === id));
    if (notFoundGroupIds.length > 0) {
      const response = await this._httpService.get<GroupDto[]>(
        AxiosHelper.injectParamsToStrUrl(GROUP_ENDPOINT.INTERNAL.SHARED_GROUPS, {
          ids: notFoundGroupIds.join(','),
        })
      );
      if (response.status === HttpStatus.OK) {
        groups = groups.concat(response.data['data']);
      }
    }

    const result: GroupDto[] = [];
    for (const group of groups) {
      if (group) {
        result.push(new GroupDto(group));
      }
    }
    return result;
  }

  public async getGroupMembersDividedByRole(
    actor: UserDto,
    groupIds: string[],
    pagination?: { offset?: number; limit?: number }
  ): Promise<GroupMember[]> {
    const response = await Promise.all(
      groupIds.map(async (groupId): Promise<GroupMember[]> => {
        try {
          const response = await this._httpService.get(
            GROUP_ENDPOINT.GROUP_MEMBERS.replace(':groupId', groupId),
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

  public async getUserRoleInGroups(
    groupIds: string[],
    roles: ROLE_TYPE[]
  ): Promise<GetUserRoleInGroupsResult> {
    const defaultResult: GetUserRoleInGroupsResult = {
      communityAdmin: {},
      groupAdmin: {},
      owner: {},
    };
    try {
      const response = await this._httpService.post(
        `${GROUP_ENDPOINT.INTERNAL.USER_ROLE_IN_GROUPS}`,
        {
          group_ids: groupIds,
          roles,
        }
      );
      return response.data['data'];
    } catch (ex) {
      this._logger.error(JSON.stringify(ex));
      return defaultResult;
    }
  }

  public async getCursorUserIdsInGroups(input: GetUserIdsInGroupsProps): Promise<{
    list: string[];
    cursor: string;
  }> {
    const { groupIds, notInGroupIds, includeDeactivated, ignoreUserIds, limit, after } = input;
    try {
      const response = await this._httpService.post(
        `${GROUP_ENDPOINT.INTERNAL.USERS_IN_GROUPS_BY_CURSOR}`,
        {
          group_ids: groupIds,
          ignore_group_ids: notInGroupIds,
          ignoreUserIds,
          include_deactivated: includeDeactivated || false,
          limit: limit || 5000,
          after: after || null,
        }
      );
      return {
        list: response.data['data'],
        cursor: response.data['meta']['cursors']['next'],
      };
    } catch (ex) {
      this._logger.error(JSON.stringify(ex));
      return {
        list: [],
        cursor: null,
      };
    }
  }

  public async countUsersInGroups(input: CountUsersInGroupsProps): Promise<{ total: number }> {
    const { groupIds, notInGroupIds, includeDeactivated, ignoreUserIds } = input;

    try {
      const response = await this._httpService.post(
        `${GROUP_ENDPOINT.INTERNAL.NUMBER_USERS_IN_GROUPS}`,
        {
          group_ids: groupIds,
          ignore_group_ids: notInGroupIds,
          ignore_user_ids: ignoreUserIds,
          include_deactivated: includeDeactivated || false,
        }
      );
      return {
        total: response.data['data'].total,
      };
    } catch (ex) {
      this._logger.error(JSON.stringify(ex));
      return { total: 0 };
    }
  }

  public async getPaginationGroupsMembers(
    input: GetPaginationGroupsMembersProps
  ): Promise<{ list: string[] }> {
    const { groupIds, notInGroupIds, includeDeactivated, ignoreUserIds, limit, offset } = input;
    try {
      const response = await this._httpService.post(`${GROUP_ENDPOINT.INTERNAL.USERS_IN_GROUPS}`, {
        group_ids: groupIds,
        ignore_group_ids: notInGroupIds,
        ignore_user_ids: ignoreUserIds,
        include_deactivated: includeDeactivated || false,
        offset,
        limit,
      });
      return {
        list: response.data['data'],
      };
    } catch (ex) {
      this._logger.error(JSON.stringify(ex));
      return { list: [] };
    }
  }
}
