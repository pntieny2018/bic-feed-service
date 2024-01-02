import { ROLE_TYPE } from '@beincom/constants';
import { CACHE_KEYS } from '@libs/common/constants';
import { ArrayHelper, AxiosHelper } from '@libs/common/helpers';
import { Traceable } from '@libs/common/modules/opentelemetry';
import { GROUP_HTTP_TOKEN, IHttpService } from '@libs/infra/http';
import { RedisService } from '@libs/infra/redis';
import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';

import { GROUP_ENDPOINT } from './endpoint.constant';
import { GroupDto } from './group.dto';
import {
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
