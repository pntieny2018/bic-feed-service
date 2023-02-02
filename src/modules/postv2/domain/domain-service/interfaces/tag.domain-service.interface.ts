import { CreateTagCommandPayload } from '../../../application/command/create-tag/create-tag.command';
import { UpdateTagPayload } from '../../../application/command/update-tag/update-tag.command';
import { TagEntity } from '../../model/tag';

export type TagCreateProps = {
  name: string;
  groupId: string;
  userId: string;
};

export type TagUpdateProps = {
  name: string;
  id: string;
  userId: string;
};

export interface ITagDomainService {
  createTag(data: TagCreateProps): Promise<TagEntity>;
  updateTag(tag: TagEntity, data: TagUpdateProps): Promise<void>;
  deleteTag(id: string): Promise<void>;
}
export const TAG_DOMAIN_SERVICE_TOKEN = 'TAG_DOMAIN_SERVICE_TOKEN';
