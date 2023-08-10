import {
  LinkPreviewAttributes,
  LinkPreviewModel,
} from '@app/database/postgres/model/link-preview.model';

export interface ILibLinkPreviewRepository {
  create(data: LinkPreviewAttributes): Promise<void>;
  update(linkPreviewId: string, data: Partial<LinkPreviewAttributes>): Promise<void>;
  findByUrl(url: string): Promise<LinkPreviewModel>;
}

export const LIB_LINK_PREVIEW_REPOSITORY_TOKEN = 'LIB_LINK_PREVIEW_REPOSITORY_TOKEN';
