import { ImageResource } from '../../../../data-type';

export type ImageDto = {
  id: string;
  url: string;
  source: string;
  createdBy: string;
  mimeType: string;
  resource: ImageResource;
  width: number;
  height: number;
  status: string;
};
