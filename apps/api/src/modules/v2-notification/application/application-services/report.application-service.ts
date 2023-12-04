import { KAFKA_TOPIC } from '@libs/infra/kafka';
import { UserDto } from '@libs/service/user';
import { Inject } from '@nestjs/common';

import { ReportHasBeenApproved, ReportHasBeenCreated } from '../../../../common/constants';
import { ReportDto } from '../../../v2-post/application/dto';
import { TargetType, VerbActivity } from '../../data-type';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../../domain/infra-adapter-interface';
import { NotificationActivityDto, NotificationPayloadDto } from '../dto';
import { ReportActivityObjectDto } from '../dto/report.dto';

import {
  IReportNotificationApplicationService,
  ReportCreatedNotificationPayload,
  ReportHiddenNotificationPayload,
} from './interface';

export class ReportNotificationApplicationService implements IReportNotificationApplicationService {
  public constructor(
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter
  ) {}

  public async sendReportCreatedNotification(
    payload: ReportCreatedNotificationPayload
  ): Promise<void> {
    const { actor, report, content } = payload;

    const reportObject = this._createReportCreatedActivityObject(report, actor);
    const activity = this._createReportCreatedActivity(reportObject);

    const kafkaPayload = new NotificationPayloadDto<ReportActivityObjectDto>({
      key: report.id,
      value: {
        actor,
        event: ReportHasBeenCreated,
        data: activity,
        meta: {
          report: { content },
        },
      },
    });

    await this._kafkaAdapter.emit(KAFKA_TOPIC.STREAM.REPORT, kafkaPayload);
  }

  private _createReportCreatedActivityObject(
    report: ReportDto,
    actor: UserDto
  ): ReportActivityObjectDto {
    const reportDetails = [
      {
        targetId: report.targetId,
        groupId: report.groupId,
      },
    ];

    return new ReportActivityObjectDto({
      id: report.id,
      actor,
      report: {
        ...report,
        details: reportDetails,
      },
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
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

  public async sendReportHiddenNotification(
    payload: ReportHiddenNotificationPayload
  ): Promise<void> {
    const { actor, reports, content } = payload;

    const reportObject = this._createReportHiddenActivityObject(reports, actor);
    const activity = this._createReportHiddenActivity(reportObject);

    const kafkaPayload = new NotificationPayloadDto<ReportActivityObjectDto>({
      key: reports[0].targetId,
      value: {
        actor,
        event: ReportHasBeenApproved,
        data: activity,
        meta: {
          report: { content, creatorId: reports[0].targetActorId },
        },
      },
    });

    await this._kafkaAdapter.emit(KAFKA_TOPIC.STREAM.REPORT, kafkaPayload);
  }

  private _createReportHiddenActivityObject(
    reports: ReportDto[],
    actor: UserDto
  ): ReportActivityObjectDto {
    const report = reports[0];

    const reporterIds = report.reasonsCount
      .map((reasonCount) => (reasonCount.reporters || []).map((reporter) => reporter.id))
      .flat();
    const reportDetails = reports.map((report) => ({
      targetId: report.targetId,
      groupId: report.groupId,
    }));

    return new ReportActivityObjectDto({
      id: report.id,
      actor,
      report: {
        ...report,
        details: reportDetails,
        reporterIds,
      },
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
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
