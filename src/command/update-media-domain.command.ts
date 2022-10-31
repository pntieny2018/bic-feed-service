import { Command, CommandRunner } from 'nest-commander';
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
      console.log('Number of updating records: ', mediaFix.length);
      for (const record of mediaFix) {
        await record.update({ url: record.url.replace(oldDomain, newDomain) });
      }
      console.log('Update done!');
      process.exit();
    } catch (e) {
      console.log(e);
    }
  }
}
