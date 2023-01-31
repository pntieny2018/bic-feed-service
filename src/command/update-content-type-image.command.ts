import { Command, CommandRunner } from 'nest-commander';
import { InjectModel } from '@nestjs/sequelize';
import { MediaModel, MediaType } from '../database/models/media.model';
import { UploadService } from '../modules/upload';
///post/images/
@Command({ name: 'update-content-type-image', description: 'Update domain of media url' })
export class UpdateContentTypeImageCommand implements CommandRunner {
  public constructor(
    @InjectModel(MediaModel) private _mediaModel: typeof MediaModel,
    private _uploadService: UploadService
  ) {}

  public async run(passedParam: string[]): Promise<any> {
    try {
      const mediaFix = await this._mediaModel.findAll({
        where: {
          type: MediaType.IMAGE,
        },
      });
      let total = 0;
      for (const record of mediaFix) {
        if (
          record.mimeType &&
          record.url &&
          (record.url.includes('.avif') || record.url.includes('.gif'))
        ) {
          const url = new URL(record.url);
          if (url.pathname) {
            const isSuccess = await this._uploadService.updateContentType(
              url.pathname,
              record.mimeType
            );
            if (isSuccess) total++;
          }
        }
      }
      console.log(`Updated ${total} done!`);
      process.exit();
    } catch (e) {
      console.log(e);
    }
  }
}
