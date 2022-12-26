import { InjectModel } from '@nestjs/sequelize';
import { TagModel } from '../../../../database/models/tag.model';
import { ITag } from '../../domain/model/tag/tag.entity';
import {
  GetTagListProps,
  ITagRepository,
} from '../../domain/repositoty-interface/tag.repository.interface';

export class TagRepository implements ITagRepository {
  public constructor(
    @InjectModel(TagModel)
    private readonly _tagModel: typeof TagModel
  ) {}

  public async getList(input: GetTagListProps): Promise<Page ITag[]> {}
}
