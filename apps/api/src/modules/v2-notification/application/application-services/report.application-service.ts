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
    const { actor, report, adminInfos, content } = payload;

    const reportObject = this._createReportActivityObject(report, actor);
    const activity = this._createReportCreatedActivity(reportObject);

    const kafkaPayload = new NotificationPayloadDto<ReportActivityObjectDto>({
      key: report.id,
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
    const { actor, report, adminInfos, content } = payload;

    const reportObject = this._createReportActivityObject(report, actor);
    const activity = this._createReportHiddenActivity(reportObject);

    const kafkaPayload = new NotificationPayloadDto<ReportActivityObjectDto>({
      key: report.id,
      value: {
        actor,
        event: ReportHasBeenApproved,
        data: activity,
        meta: {
          report: { adminInfos, content, creatorId: report.targetActorId },
        },
      },
    });

    await this._kafkaAdapter.emit(KAFKA_TOPIC.STREAM.REPORT, kafkaPayload);
  }

  private _createReportActivityObject(report: ReportDto, actor: UserDto): ReportActivityObjectDto {
    return new ReportActivityObjectDto({
      id: report.id,
      actor,
      report: { ...report, details: report.details || [] },
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
