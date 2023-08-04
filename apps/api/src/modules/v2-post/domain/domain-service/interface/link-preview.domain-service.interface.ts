import { LinkPreviewEntity } from '../../model/link-preview';

export type LinkPreviewProps = {
  url: string;
  domain: string;
  image: string;
  title: string;
  description: string;
};

export interface ILinkPreviewDomainService {
  findOrUpsert(data: LinkPreviewProps): Promise<LinkPreviewEntity>;
}
export const LINK_PREVIEW_DOMAIN_SERVICE_TOKEN = 'LINK_PREVIEW_DOMAIN_SERVICE_TOKEN';
