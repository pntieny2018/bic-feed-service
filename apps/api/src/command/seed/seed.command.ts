import { RedisService } from '@libs/infra/redis';
import { Logger } from '@nestjs/common';
import { Command, CommandRunner } from 'nest-commander';

@Command({ name: 'seed', description: 'Create shared user and group data' })
export class SeedCommand implements CommandRunner {
  public logger = new Logger(SeedCommand.name);

  public constructor(private _storeService: RedisService) {}

  public async run(): Promise<any> {
    const groups = [
      {
        id: 1,
        name: 'Group 1',
        icon: 'https://docs.nestjs.com/assets/logo-small.svg',
      },
      {
        id: 2,
        name: 'Group 2',
        icon: 'https://docs.nestjs.com/assets/logo-small.svg',
      },
    ];
    const users = [
      {
        id: 1,
        username: 'username1',
        fullname: 'User Name 1',
        avatar: 'https://docs.nestjs.com/assets/logo-small.svg',
        groups: [1, 2],
      },
      {
        id: 2,
        username: 'username2',
        fullname: 'User Name 2',
        avatar: 'https://docs.nestjs.com/assets/logo-small.svg',
        groups: [1, 2],
      },
    ];

    groups.forEach((g) => this._storeService.set(`GS:${g.id}`, g));
    users.forEach((u) => this._storeService.set(`US:${u.id}`, u));

    this.logger.debug('done');
  }
}
