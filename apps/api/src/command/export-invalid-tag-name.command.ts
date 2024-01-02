/* eslint-disable no-console */
import { GROUP_SERVICE_TOKEN, IGroupService } from '@libs/service/group';
import { IUserService, USER_SERVICE_TOKEN } from '@libs/service/user';
import { Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Command, CommandRunner } from 'nest-commander';
import { Op, Sequelize } from 'sequelize';

import { TagModel } from '../database/models/tag.model';

@Command({
  name: 'export-invalid-tag',
  description: 'Export invalid tag',
})
export class ExportInvalidTagNameCommand implements CommandRunner {
  public constructor(
    @InjectModel(TagModel) private _tagModel: typeof TagModel,
    @Inject(USER_SERVICE_TOKEN)
    private _userService: IUserService,
    @Inject(GROUP_SERVICE_TOKEN)
    private _groupAppService: IGroupService
  ) {}

  public async run(): Promise<any> {
    try {
      console.log('Start export');
      await this._exportData();
    } catch (e) {
      console.log(e);
    }
    process.exit();
  }

  private async _exportData(): Promise<void> {
    let count = 0;

    const tags = await this._tagModel.findAll({
      attributes: TagModel.loadAllAttributes(),
      where: {
        [Op.and]: Sequelize.literal(`LENGTH(name) <= 3`),
      },
      order: [['totalUsed', 'DESC']],
    });

    const userIds = [];
    const groupIds = [];
    tags.forEach((tag) => {
      groupIds.push(tag.groupId);
      userIds.push(tag.createdBy);
    });

    const users = await this._userService.findAllByIds(userIds);

    const communities = await this._groupAppService.findAllByIds(groupIds);

    const data = [];

    for (const tag of tags) {
      count++;
      console.log(`Exporting ${count}/${tags.length}`);
      const createdBy = users.find((user) => user.id === tag.createdBy);
      const community = communities.find((i) => i.id === tag.groupId);
      data.push({
        tag_name: tag.name,
        community: community?.name,
        created_by: createdBy?.fullname,
        created_by_username: createdBy?.username,
        total_content: tag.totalUsed,
      });
    }

    console.log('Export data done');
    console.log('=================================');
    console.log(JSON.stringify(data));
  }
}
