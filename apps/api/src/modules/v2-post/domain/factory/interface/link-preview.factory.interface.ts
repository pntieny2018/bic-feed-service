import { LinkPreviewEntity, LinkPreviewProps } from '../../model/link-preview';
import { LinkPreviewDto } from '../../../application/dto';

export interface ILinkPreviewFactory {
  createLinkPreview(props: LinkPreviewDto): LinkPreviewEntity;
  reconstitute(props: LinkPreviewProps): LinkPreviewEntity;
}

export const LINK_PREVIEW_FACTORY_TOKEN = 'LINK_PREVIEW_FACTORY_TOKEN';
