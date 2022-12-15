import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable } from '@nestjs/common';
import { GROUP_ADMIN_PATH } from '../../common/constants';

@Injectable()
export class GroupHttpService {
  public constructor(private readonly _httpService: HttpService) {}

  public async getAdminIds(
    authInfo: {
      username: string;
      email: string;
    },
    groupId: string
  ): Promise<string[]> {
    try {
      const params = {
        key: '',
        offset: 0,
        limit: 20,
      };
      const response = await lastValueFrom(
        this._httpService.get(GROUP_ADMIN_PATH.replace(':id', groupId), {
          params: params,
          headers: {
            user: JSON.stringify({
              ['cognito:username']: authInfo.username,
              email: authInfo.email,
              ['token_use']: 'id',
            }),
          },
        })
      );
      if (response.status !== HttpStatus.OK) {
        return [];
      }

      const admins: { id: string }[] = response.data['data']['group_admin']['data'];
      return admins.map((admin) => admin.id);
    } catch (ex) {
      return [];
    }
  }
}
