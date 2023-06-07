import { Command, CommandRunner } from 'nest-commander';
import { InjectModel } from '@nestjs/sequelize';
import { Node } from 'slate';
import { PostModel } from '../database/models/post.model';
import { PostType } from '../modules/v2-post/data-type';
import * as process from 'process';

export const getWordCount = (content) => {
  let count = 0;
  if (!content) return 0;
  try {
    const value = JSON.parse(content);
    value.forEach((node) => {
      const str = Node.string(node).trim();
      if (str) {
        count += str.split(/\s+/).length;
      }
    });
    return count;
  } catch (e) {
    return 0;
  }
};

@Command({ name: 'migrate-word-count', description: 'Migrate word count for article' })
export class MigrateWordCountCommand implements CommandRunner {
  public constructor(@InjectModel(PostModel) private _postModel: typeof PostModel) {}

  public async run(): Promise<any> {
    const articles = await this._postModel.findAll({
      where: {
        type: PostType.ARTICLE,
      },
    });
    let total = 0;
    for (const article of articles) {
      if (article.content) {
        const wordCount = getWordCount(article.content);
        total++;
        await this._postModel.update({ wordCount }, { where: { id: article.id } });
      }
    }
    console.log(`Updated ${total} articles`);
    process.exit();
  }
}
