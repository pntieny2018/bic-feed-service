import { LinkPreviewAttributes, LinkPreviewModel } from '@libs/database/postgres/model';

export interface ILibLinkPreviewRepository {
  create(data: LinkPreviewAttributes): Promise<void>;
  update(linkPreviewId: string, data: Partial<LinkPreviewAttributes>): Promise<void>;
  findByUrl(url: string): Promise<LinkPreviewModel>;
}

export const LIB_LINK_PREVIEW_REPOSITORY_TOKEN = 'LIB_LINK_PREVIEW_REPOSITORY_TOKEN';
