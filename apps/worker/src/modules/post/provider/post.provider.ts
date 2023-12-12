import { ContentCron } from '../application/cron/content.cron';
import { PostCronService } from '../application/cron/post.cron';
import { ContentDomainService } from '../domain/domain-service';
import { CONTENT_DOMAIN_SERVICE_TOKEN } from '../domain/domain-service/interface';
import { CONTENT_REPOSITORY_TOKEN } from '../domain/repositoty-interface';
import { ContentRepository } from '../driven-adapter/repository';

export const postProvider = [
  /** Application Cron Handler */
  ContentCron,
  PostCronService,

  {
    provide: CONTENT_DOMAIN_SERVICE_TOKEN,
    useClass: ContentDomainService,
  },
  {
    provide: CONTENT_REPOSITORY_TOKEN,
    useClass: ContentRepository,
  },
];
