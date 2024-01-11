import { MediaModel } from '@libs/database/postgres/model';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Command, CommandRunner } from 'nest-commander';

///post/images/
@Command({ name: 'move-media-bucket', description: 'Update domain of media url' })
export class MoveMediaBucketCommand implements CommandRunner {
  public constructor(
    @InjectModel(MediaModel) private _mediaModel: typeof MediaModel,
    private _configService: ConfigService
  ) {}

  public async run(passedParam: string[]): Promise<any> {
    try {
      const mediaFix = await this._mediaModel.findAll();
      let total = 0;
      for (const record of mediaFix) {
        if (record.url && record.url.includes('/post/images/original')) {
          total++;
          console.log('Updated media: ', record.id);
          await record.update({
            url: record.url.replace('/post/images/original', '/post/original'),
          });
        }
        if (record.url && record.url.includes('/comment/images/original')) {
          total++;
          console.log('Updated media: ', record.id);
          await record.update({
            url: record.url.replace('/comment/images/original', '/comment/original'),
          });
        }
      }
      console.log(`Updated ${total} done!`);
      process.exit();
    } catch (e) {
      console.log(e);
    }
  }
}
