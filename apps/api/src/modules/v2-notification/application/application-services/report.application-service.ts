import { UserDto } from '@libs/service/user';
import { Inject } from '@nestjs/common';

import {
  KAFKA_TOPIC,
  ReportHasBeenApproved,
  ReportHasBeenCreated,
} from '../../../../common/constants';
import { ReportDto } from '../../../v2-post/application/dto';
import { TargetType, VerbActivity } from '../../data-type';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../../domain/infra-adapter-interface';
import { NotificationActivityDto, NotificationPayloadDto } from '../dto';
import { ReportActivityObjectDto } from '../dto/report.dto';

import { IReportNotificationApplicationService, ReportNotificationPayload } from './interface';

export class ReportNotificationApplicationService implements IReportNotificationApplicationService {
  public constructor(
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter
  ) {}

  public async sendReportCreatedNotification(payload: ReportNotificationPayload): Promise<void> {
    const { actor, reports, adminInfos, content } = payload;

    const reportObject = this._createReportActivityObject(reports, actor);
    const activity = this._createReportCreatedActivity(reportObject);

    const kafkaPayload = new NotificationPayloadDto<ReportActivityObjectDto>({
      key: reports[0].targetId,
      value: {
        actor,
        event: ReportHasBeenCreated,
        data: activity,
        meta: {
          report: { adminInfos, content },
        },
      },
    });

    await this._kafkaAdapter.emit(KAFKA_TOPIC.STREAM.REPORT, kafkaPayload);
  }

  public async sendReportHiddenNotification(payload: ReportNotificationPayload): Promise<void> {
    const { actor, reports, adminInfos, content } = payload;

    const reportObject = this._createReportActivityObject(reports, actor);
    const activity = this._createReportHiddenActivity(reportObject);

    const kafkaPayload = new NotificationPayloadDto<ReportActivityObjectDto>({
      key: reports[0].targetId,
      value: {
        actor,
        event: ReportHasBeenApproved,
        data: activity,
        meta: {
          report: { adminInfos, content, creatorId: reports[0].targetActorId },
        },
      },
    });

    await this._kafkaAdapter.emit(KAFKA_TOPIC.STREAM.REPORT, kafkaPayload);
  }

  // TODO: refactor after noti v3 release
  // Keep code to test notification error
  private _createReportActivityObject(
    reports: ReportDto[],
    actor: UserDto
  ): ReportActivityObjectDto {
    return new ReportActivityObjectDto({
      id: reports[0].id,
      actor,
      report: {
        id: reports[0].id,
        targetId: reports[0].targetId,
        targetType: reports[0].targetType,
        status: reports[0].status,
        details: [],
      },
      createdAt: reports[0].createdAt,
      updatedAt: reports[0].updatedAt,
    });
  }

  private _createReportCreatedActivity(
    report: ReportActivityObjectDto
  ): NotificationActivityDto<ReportActivityObjectDto> {
    return new NotificationActivityDto<ReportActivityObjectDto>({
      id: report.id,
      object: report,
      verb: VerbActivity.REPORT,
      target: TargetType.REPORT_CONTENT,
      createdAt: report.createdAt,
    });
  }

  private _createReportHiddenActivity(
    report: ReportActivityObjectDto
  ): NotificationActivityDto<ReportActivityObjectDto> {
    return new NotificationActivityDto<ReportActivityObjectDto>({
      id: report.id,
      object: report,
      verb: VerbActivity.APPROVE_REPORT_CONTENT,
      target: TargetType.REPORT_CONTENT,
      createdAt: report.createdAt,
    });
  }
}
