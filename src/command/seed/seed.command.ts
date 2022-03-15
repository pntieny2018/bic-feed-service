import { RedisService } from '../../../libs/redis/src/redis.service';

import { Command, CommandRunner } from 'nest-commander';
import { Logger } from '@nestjs/common';

@Command({ name: 'seed', description: 'Create shared user and group data' })
export class SeedCommand implements CommandRunner {
  public logger = new Logger(SeedCommand.name);

  public constructor(private _storeService: RedisService) {}

  public async run(): Promise<any> {
    const groups = [
      {
        groupId: 1,
        name: 'Group 1',
        icon: 'https://docs.nestjs.com/assets/logo-small.svg',
      },
      {
        groupId: 2,
        name: 'Group 2',
        icon: 'https://docs.nestjs.com/assets/logo-small.svg',
      },
    ];
    const users = [
      {
        userId: 1,
        username: 'username1',
        fullname: 'User Name 1',
        avatar: 'https://docs.nestjs.com/assets/logo-small.svg',
        groups: [1, 2],
      },
      {
        userId: 2,
        username: 'username2',
        fullname: 'User Name 2',
        avatar: 'https://docs.nestjs.com/assets/logo-small.svg',
        groups: [1, 2],
      },
    ];

    groups.forEach((g) => this._storeService.set(`GS:${g.groupId}`, g));
    users.forEach((u) => this._storeService.set(`US:${u.userId}`, u));

    this.logger.log('done');
  }
}
