import { MediaModel } from '@libs/database/postgres/model';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Command, CommandRunner, Option } from 'nest-commander';
import { Op } from 'sequelize';

interface ICommandOptions {
  updateThumbnail: boolean;
}
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
  public async run(passedParam: string[], options?: ICommandOptions): Promise<any> {
    if (passedParam.length < 2) {
      console.log('Incorrect command, please run with :fix:media:domain {oldDomain} {newDomain}');
      process.exit();
    }
    try {
      const oldDomain = passedParam[0];
      const newDomain = passedParam[1];
      const isUpdateThumbnail = options.updateThumbnail ?? false;

      let condition;
      if (isUpdateThumbnail) {
        condition = {
          where: { type: 'video' },
        };
      } else {
        condition = {
          where: { url: { [Op.like]: '%' + oldDomain + '%' } },
        };
      }
      const mediaFix = await this._mediaModel.findAll(condition);
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
          await this._mediaModel.update(
            {
              thumbnails,
            },
            {
              where: {
                id: record.id,
              },
            }
          );
        }
        if (!isUpdateThumbnail) {
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
      }
      console.log(`Updated ${count} done!`);
      process.exit();
    } catch (e) {
      console.log(e);
    }
  }
}
