import { UserDto } from '@libs/service/user';
import { Inject } from '@nestjs/common';

import { KAFKA_TOPIC, ReportCreated } from '../../../../common/constants';
import { ReportDto } from '../../../v2-post/application/dto';
import { TargetType, VerbActivity } from '../../data-type';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../../domain/infra-adapter-interface';
import { NotificationActivityDto, NotificationPayloadDto } from '../dto';
import { ReportActivityObjectDto } from '../dto/report.dto';

import {
  IReportNotificationApplicationService,
  ReportCreatedNotificationPayload,
} from './interface';

export class ReportNotificationApplicationService implements IReportNotificationApplicationService {
  public constructor(
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter
  ) {}

  public async sendReportCreatedNotification(
    payload: ReportCreatedNotificationPayload
  ): Promise<void> {
    const { actor, report, adminInfos } = payload;

    const commentObject = this._createReportActivityObject(report, actor);
    const activity = this._createReportActivity(commentObject);

    const kafkaPayload: NotificationPayloadDto<ReportActivityObjectDto> = {
      key: report.id,
      value: {
        actor,
        event: ReportCreated,
        data: activity,
        meta: {
          report: { adminInfos },
        },
      },
    };

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

  private _createReportActivity(
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
}
