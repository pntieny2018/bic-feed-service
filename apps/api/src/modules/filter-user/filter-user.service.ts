import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ReportContentModel } from '../../database/models/report-content.model';
import { ReportContentDetailModel } from '../../database/models/report-content-detail.model';

@Injectable()
export class FilterUserService {
  public constructor(
    @InjectModel(ReportContentModel)
    private readonly _reportContentModel: typeof ReportContentModel
  ) {}

  public async filterUser(targetId: string, userIds: string[]): Promise<string[]> {
    if (!userIds || !userIds?.length) {
      return [];
    }

    const records = await this._reportContentModel.findAll({
      include: [
        {
          model: ReportContentDetailModel,
          as: 'details',
          where: {
            createdBy: userIds,
          },
        },
      ],
      where: {
        targetId: targetId,
      },
    });

    if (!records || !records?.length) {
      return userIds;
    }
    const details = records.map((r) => r.details).flat();

    const reporterIds = [...new Set(details.map((d) => d.createdBy))];

    return userIds.filter((userId) => !reporterIds.includes(userId));
  }
}
