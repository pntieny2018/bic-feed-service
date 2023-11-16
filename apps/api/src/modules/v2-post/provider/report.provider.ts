import { REPORT_BINDING_TOKEN, ReportBinding } from '../application/binding';
import { ReportContentHandler } from '../application/command/content';
import { ReportCreatedEventHandler } from '../application/event-handler/content';
import { REPORT_DOMAIN_SERVICE_TOKEN } from '../domain/domain-service/interface';
import { ReportDomainService } from '../domain/domain-service/report.domain-service';
import { REPORT_REPOSITORY_TOKEN } from '../domain/repositoty-interface';
import { ReportMapper } from '../driven-adapter/mapper';
import { ReportRepository } from '../driven-adapter/repository';

export const reportProvider = [
  /* Application Command */
  ReportContentHandler,
  ReportContentHandler,

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

  /* Repository */
  {
    provide: REPORT_REPOSITORY_TOKEN,
    useClass: ReportRepository,
  },

  /* Mapper */
  ReportMapper,
];
