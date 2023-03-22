import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../../../libs/redis/src';
import { ArrayHelper, AxiosHelper } from '../../../../common/helpers';
import { AppHelper } from '../../../../common/helpers/app.helper';
import { GroupEntity } from '../../domain/model/group';
import { IGroupRepository } from '../../domain/repositoty-interface/group.repository.interface';
import { GROUP_PRIVACY } from '../../data-type';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { UserDto } from '../../../v2-user/application';
import { ENDPOINT } from '../../../../common/constants/endpoint.constant';

type GroupDataInCache = {
  id: string;
  name: string;
  icon: string;
  privacy: GROUP_PRIVACY;
  communityId: string;
  rootGroupId: string;
  isCommunity: boolean;
  child: {
    open: string[];
    closed: string[];
    private: string[];
    secret: string[];
  };
};

@Injectable()
export class GroupRepository implements IGroupRepository {
  private readonly _logger = new Logger(GroupRepository.name);

  public constructor(private readonly _httpService: HttpService, private _store: RedisService) {}

  private readonly _prefixRedis = `${AppHelper.getRedisEnv()}SG:`;

  public async findOne(groupId: string): Promise<GroupEntity> {
    let group = await this._store.get<GroupDataInCache>(`${this._prefixRedis}${groupId}`);
    if (group === null) {
      const response = await lastValueFrom(
        this._httpService.get(
          AxiosHelper.injectParamsToStrUrl(ENDPOINT.GROUP.INTERNAL.GROUPS_PATH, {
            ids: groupId,
          })
        )
      );
      if (response.status === HttpStatus.OK) {
        group = AxiosHelper.getDataArrayResponse<GroupDataInCache>(response)[0];
      }
      if (!group) {
        return null;
      }
    }
    return new GroupEntity(group);
  }

  public async findAllByIds(groupIds: string[]): Promise<GroupEntity[]> {
    const keys = [...new Set(ArrayHelper.arrayUnique(groupIds.map((id) => id)))].map(
      (groupId) => `${this._prefixRedis + groupId}`
    );
    let groups = await this._store.mget(keys);
    const notFoundGroupIds = groupIds.filter((id) => !groups.find((group) => group?.id === id));
    if (notFoundGroupIds.length > 0) {
      const response = await lastValueFrom(
        this._httpService.get(
          AxiosHelper.injectParamsToStrUrl(ENDPOINT.GROUP.INTERNAL.GROUPS_PATH, {
            ids: notFoundGroupIds.join(','),
          })
        )
      );
      if (response.status === HttpStatus.OK) {
        groups = groups.concat(AxiosHelper.getDataArrayResponse<GroupDataInCache>(response));
      }
    }
    const result = [];
    for (const group of groups) {
      if (group) {
        result.push(new GroupEntity(group));
      }
    }
    return result;
  }

  public async getGroupAdminIds(
    actor: UserDto,
    groupIds: string[],
    offset = 0,
    limit = 50
  ): Promise<string[]> {
    const response: string[][] = await Promise.all(
      groupIds.map(async (groupId): Promise<string[]> => {
        try {
          const response = await lastValueFrom(
            this._httpService.get(ENDPOINT.GROUP.GROUP_ADMIN_PATH.replace(':groupId', groupId), {
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
            })
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

      const response = await lastValueFrom(
        this._httpService.get(`${ENDPOINT.GROUP.INTERNAL.COMMUNITY_ADMIN_PATH}?${params}`)
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
