import { Command, CommandRunner } from 'nest-commander';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { ConfigService } from '@nestjs/config';
import { ExternalService } from '../app/external.service';
import { LinkPreviewModel } from '../database/models/link-preview.model';

interface ICommandOptions {
  backupContent: boolean;
}

//npx ts-node -r tsconfig-paths/register src/command/cli.ts migrate:link-preview
// node dist/src/command/cli.js migrate:link-preview
@Command({ name: 'migrate:link-preview', description: 'Move media to Upload service' })
export class MigrateLinkPreviewCommand implements CommandRunner {
  public constructor(
    @InjectModel(LinkPreviewModel) private _linkPreviewModel: typeof LinkPreviewModel,
    private _configService: ConfigService,
    private _externalService: ExternalService
  ) {}

  public async run(prams, options?: ICommandOptions): Promise<any> {
    try {
      console.info('Migrate link preview');
      await this.migrateLinkPreview(null, options);
      console.info('DONE!');
    } catch (e) {
      console.log(e);
      throw e;
    }

    process.exit();
  }

  public getMediaIdFromURL(url): string {
    const matchUUID = url.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
    return matchUUID !== null && matchUUID.length > 0 ? matchUUID[0] : null;
  }

  public async migrateLinkPreview(testId = null, options?: ICommandOptions): Promise<void> {
    const condition = {};
    if (testId) condition['id'] = testId;

    let stop = false;
    let offset = 0;
    let totalUpdated = 0;
    const limit = 200;
    while (!stop) {
      const links = await this._linkPreviewModel.findAll({
        attributes: ['id', 'image'],
        where: {
          image: {
            [Op.like]: `%s3-bucket.s3%`,
          },
        },
        limit,
        offset,
        order: [['id', 'asc']],
      });

      for (const link of links) {
        const imageId = this.getMediaIdFromURL(link.image);
        if (imageId === null) {
          console.error(`Can not identify UUID from URL ${link.image}`);
          continue;
        }

        const images = await this._externalService.getImageIds([imageId]);
        if (images.length === 0) continue;
        await this._linkPreviewModel.update(
          {
            image: images[0].url,
          },
          {
            where: { id: link.id },
          }
        );
        console.log(`Changed ${link.image} to ${images[0].url}`);
        totalUpdated++;
      }
      console.log(`Updated ${totalUpdated}`);
      if (links.length === 0) stop = true;
      offset = limit + offset;
    }
  }
}
