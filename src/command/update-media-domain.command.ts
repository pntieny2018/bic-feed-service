import { Command, CommandRunner } from 'nest-commander';
import { InjectModel } from '@nestjs/sequelize';
import { MediaModel } from '../database/models/media.model';
import { Op } from 'sequelize';
import { ConfigService } from '@nestjs/config';
import { IAppConfig } from '../config/app';

@Command({ name: 'fix:media:domain', description: 'Update domain of media url' })
export class UpdateMediaDomainCommand implements CommandRunner {
  public constructor(
    @InjectModel(MediaModel) private _mediaModel: typeof MediaModel,
    private _configService: ConfigService
  ) {}

  public async run(): Promise<any> {
    try {
      const env = this._configService.get<IAppConfig>('app').env;

      let oldDomain, newDomain;
      if (env === 'sandbox') {
        oldDomain = 'sbx.bein.group';
        newDomain = 'beincomm.io';
      } else if (env === 'staging') {
        oldDomain = 'stg.bein.group';
        newDomain = 'beincomm.app';
      } else {
        process.exit();
      }
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
