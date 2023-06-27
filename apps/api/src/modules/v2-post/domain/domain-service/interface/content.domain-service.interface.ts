import { ContentEntity } from '../../model/content/content.entity';

export interface IContentDomainService {
  getContent(id: string): Promise<ContentEntity>;
  getRawContent(contentEntity: ContentEntity): string;
}
export const CONTENT_DOMAIN_SERVICE_TOKEN = 'CONTENT_DOMAIN_SERVICE_TOKEN';
