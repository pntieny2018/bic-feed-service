import { REPORT_BINDING_TOKEN, ReportBinding } from '../application/binding';
import { ReportContentHandler } from '../application/command/content';
import { IgnoreReportHandler } from '../application/command/report';
import { ReportCreatedEventHandler } from '../application/event-handler/content';
import { GetListReportsHandler } from '../application/query/admin-manage';
import { REPORT_DOMAIN_SERVICE_TOKEN } from '../domain/domain-service/interface';
import { ReportDomainService } from '../domain/domain-service/report.domain-service';
import { REPORT_REPOSITORY_TOKEN } from '../domain/repositoty-interface';
import { REPORT_VALIDATOR_TOKEN } from '../domain/validator/interface';
import { ReportValidator } from '../domain/validator/report.validator';
import { ReportMapper } from '../driven-adapter/mapper';
import { ReportRepository } from '../driven-adapter/repository';

export const reportProvider = [
  /* Application Command */
  ReportContentHandler,
  ReportContentHandler,
  IgnoreReportHandler,

  /* Application Query */
  GetListReportsHandler,

  /* Application Event Handler */
  ReportCreatedEventHandler,

  /* Application Binding */
  {
    provide: REPORT_BINDING_TOKEN,
    useClass: ReportBinding,
  },

  /* Domain Service */
  {
    provide: REPORT_DOMAIN_SERVICE_TOKEN,
    useClass: ReportDomainService,
  },

  /* Validator */
  {
    provide: REPORT_VALIDATOR_TOKEN,
    useClass: ReportValidator,
  },

  /* Repository */
  {
    provide: REPORT_REPOSITORY_TOKEN,
    useClass: ReportRepository,
  },

  /* Mapper */
  ReportMapper,
];
