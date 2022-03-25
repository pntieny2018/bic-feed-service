import { Injectable } from '@nestjs/common';
import { CreateFollowDto, UnfollowDto } from './dto/requests';
import { RpcException } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/sequelize';
import { FollowModel } from '../../database/models/follow.model';
import { Op } from 'sequelize';

@Injectable()
export class FollowService {
  public constructor(@InjectModel(FollowModel) private _followModel: typeof FollowModel) {}
  public async follow(createFollowDto: CreateFollowDto): Promise<FollowModel[]> {
    try {
      const bulkCreateData = createFollowDto.userIds
        .map((userId) =>
          createFollowDto.groupIds.map((groupId) => ({
            userId: userId,
            groupId: groupId,
          }))
        )
        .flat();
      return await this._followModel.bulkCreate(bulkCreateData);
    } catch (ex) {
      throw new RpcException("Can't follow");
    }
  }

  public async unfollow(unfollowDto: UnfollowDto): Promise<number> {
    try {
      return await this._followModel.destroy({
        where: {
          groupId: unfollowDto.groupId,
          userId: {
            [Op.in]: unfollowDto.userIds,
          },
        },
      });
    } catch (ex) {
      throw new RpcException("Can't unfollow");
    }
  }

  public async getUserFollow(groupIds: number[], limit = 100): Promise<FollowModel[]> {
    return this._followModel.findAll({
      where: {
        groupId: {
          [Op.in]: groupIds,
        },
      },
      limit: limit,
    });
  }
}
