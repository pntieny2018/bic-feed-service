import { UserDto } from '@libs/service/user';
import { Inject } from '@nestjs/common';

import { KAFKA_TOPIC, ReportHasBeenCreated } from '../../../../common/constants';
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
    const { actor, report, adminInfos, content, actorsReported } = payload;

    const commentObject = this._createReportActivityObject(report, actor, actorsReported);
    const activity = this._createReportActivity(commentObject);

    const kafkaPayload: NotificationPayloadDto<ReportActivityObjectDto> = {
      key: report.id,
      value: {
        actor,
        event: ReportHasBeenCreated,
        data: activity,
        meta: {
          report: { adminInfos, content },
        },
      },
    };

    await this._kafkaAdapter.emit(KAFKA_TOPIC.STREAM.REPORT, kafkaPayload);
  }

  private _createReportActivityObject(
    report: ReportDto,
    actor: UserDto,
    actorsReported: UserDto[]
  ): ReportActivityObjectDto {
    return new ReportActivityObjectDto({
      id: report.id,
      actor,
      report: { ...report, details: report.details || [], actorsReported },
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
