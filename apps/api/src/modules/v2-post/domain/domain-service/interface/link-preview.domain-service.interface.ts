import { LinkPreviewDto } from '../../../application/dto';
import { LinkPreviewEntity } from '../../model/link-preview';

export interface ILinkPreviewDomainService {
  findOrUpsert(data: LinkPreviewDto): Promise<LinkPreviewEntity>;
}
export const LINK_PREVIEW_DOMAIN_SERVICE_TOKEN = 'LINK_PREVIEW_DOMAIN_SERVICE_TOKEN';
