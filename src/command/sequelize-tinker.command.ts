import { Command, CommandRunner } from 'nest-commander';
import { InjectModel } from '@nestjs/sequelize';
import { CommentReactionModel } from '../database/models/comment-reaction.model';
import { FeedPublisherService } from '../modules/feed-publisher';

@Command({ name: 'tinker', description: 'Create shared user and group  data' })
export class SequelizeTinkerCommand implements CommandRunner {
  public constructor(
    @InjectModel(CommentReactionModel) private _commentReactionModel: typeof CommentReactionModel,
    protected feedPublisherService: FeedPublisherService
  ) {}

  public async run(): Promise<any> {
    await this.feedPublisherService.fanoutOnWrite(1, 1, [1, 2, 3, 4], []);
  }
}
