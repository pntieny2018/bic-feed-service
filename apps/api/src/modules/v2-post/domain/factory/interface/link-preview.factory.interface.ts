import { LinkPreviewAttributes, LinkPreviewEntity } from '../../model/link-preview';

export type CreateLinkPreviewProps = {
  url: string;
  domain: string;
  image: string;
  title: string;
  description: string;
};

export interface ILinkPreviewFactory {
  createLinkPreview(props: CreateLinkPreviewProps): LinkPreviewEntity;
  reconstitute(props: LinkPreviewAttributes): LinkPreviewEntity;
}

export const LINK_PREVIEW_FACTORY_TOKEN = 'LINK_PREVIEW_FACTORY_TOKEN';
