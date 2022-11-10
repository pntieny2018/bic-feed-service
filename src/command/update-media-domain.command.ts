import { Command, CommandRunner, Option } from 'nest-commander';
import { InjectModel } from '@nestjs/sequelize';
import { MediaModel } from '../database/models/media.model';
import { Op } from 'sequelize';
import { ConfigService } from '@nestjs/config';
@Command({ name: 'fix:media:domain', description: 'Update domain of media url' })
export class UpdateMediaDomainCommand implements CommandRunner {
  public constructor(
    @InjectModel(MediaModel) private _mediaModel: typeof MediaModel,
    private _configService: ConfigService
  ) {}

  @Option({
    flags: '-s, --update-thumbnail [boolean]',
  })
  public parseBoolean(val: string): boolean {
    return JSON.parse(val);
  }
  public async run(passedParam: string[]): Promise<any> {
    if (passedParam.length < 2) {
      console.log('Incorrect command, please run with :fix:media:domain {oldDomain} {newDomain}');
      process.exit();
    }
    try {
      const oldDomain = passedParam[0];
      const newDomain = passedParam[1];

      const mediaFix = await this._mediaModel.findAll({
        where: { url: { [Op.like]: '%' + oldDomain + '%' } },
      });
      let count = 0;
      for (const record of mediaFix) {
        let thumbnails = null;
        if (record.type === 'video' && record.thumbnails) {
          thumbnails = record.thumbnails.map((thumbnail) => {
            if (thumbnail.url.includes(oldDomain)) {
              thumbnail.url = thumbnail.url.replace(oldDomain, newDomain);
            }
            return thumbnail;
          });
          count++;
        }
        await this._mediaModel.update(
          {
            url: record.url.replace(oldDomain, newDomain),
            thumbnails,
          },
          {
            where: {
              id: record.id,
            },
          }
        );
      }
      console.log(`Updated ${count} done!`);
      process.exit();
    } catch (e) {
      console.log(e);
    }
  }
}
