import { GetListReportsHandler, GetReportDetailsHandler } from '../application/query/admin-manage';
import { MANAGE_VALIDATOR_TOKEN } from '../domain/validator/interface';
import { ManageValidator } from '../domain/validator/manage.validator';

export const manageProvider = [
  GetListReportsHandler,
  GetReportDetailsHandler,

  /* Validator */
  {
    provide: MANAGE_VALIDATOR_TOKEN,
    useClass: ManageValidator,
  },
];
