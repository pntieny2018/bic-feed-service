import { LinkPreviewEntity, LinkPreviewProps } from '../../model/link-preview';

export type LinkPreviewDto = {
  url: string;
  domain: string;
  image: string;
  title: string;
  description: string;
};

export interface ILinkPreviewFactory {
  createLinkPreview(props: LinkPreviewDto): LinkPreviewEntity;
  reconstitute(props: LinkPreviewProps): LinkPreviewEntity;
}

export const LINK_PREVIEW_FACTORY_TOKEN = 'LINK_PREVIEW_FACTORY_TOKEN';
