import { Injectable } from '@nestjs/common';
import { ObjectHelper } from '../../common/helpers';
import { TypeActivity, VerbActivity } from '../notification.constants';
import { TargetType } from '../../modules/report-content/contstants';
import {
  ActivityObject,
  ActorObject,
  NotificationActivity,
} from '../dto/requests/notification-activity.dto';

@Injectable()
export class ReportActivityService {
  public createCreatedReportPayload(reportData: {
    id: string;
    actor: ActorObject;
    targetId: string;
    targetType: TargetType;
    status: string;
    details: Record<string, any>[];
    createdAt: Date;
    verb: VerbActivity;
    target: TypeActivity;
  }): NotificationActivity {
    const activityObject: ActivityObject = {
      id: reportData.id,
      actor: ObjectHelper.omit(['groups', 'email'], reportData.actor) as any,
      report: {
        targetId: reportData.targetId,
        targetType: reportData.targetType,
        details: reportData.details,
        status: reportData.status,
      },
      createdAt: reportData.createdAt,
      updatedAt: reportData.createdAt,
    };

    return new NotificationActivity(
      activityObject,
      reportData.verb,
      reportData.target,
      reportData.createdAt,
      reportData.createdAt
    );
  }
}
