import { LinkPreviewEntity } from '../model/link-preview';

export interface ILinkPreviewRepository {
  create(data: LinkPreviewEntity): Promise<void>;
  update(data: LinkPreviewEntity): Promise<void>;
  findByUrl(url: string): Promise<LinkPreviewEntity>;
}

export const LINK_PREVIEW_REPOSITORY_TOKEN = 'LINK_PREVIEW_REPOSITORY_TOKEN';
