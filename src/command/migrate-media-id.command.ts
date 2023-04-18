import { Command, CommandRunner, Option } from 'nest-commander';
import { InjectModel } from '@nestjs/sequelize';
import { MediaModel, MediaType } from '../database/models/media.model';
import { Op } from 'sequelize';
import { ConfigService } from '@nestjs/config';
import { PostModel } from '../database/models/post.model';
import { CommentModel } from '../database/models/comment.model';
import { getDatabaseConfig } from '../config/database';
import { ExternalService } from '../app/external.service';

interface ICommandOptions {
  backupId: boolean;
}

@Command({ name: 'migrate:media-id', description: 'Move media to Upload service' })
export class MigrateMediaIdCommand implements CommandRunner {
  public constructor(
    @InjectModel(MediaModel) private _mediaModel: typeof MediaModel,
    @InjectModel(PostModel) private _postModel: typeof PostModel,
    @InjectModel(CommentModel) private _commentModel: typeof CommentModel,
    private _configService: ConfigService,
    private _externalService: ExternalService
  ) {}

  @Option({
    flags: '-s, --backup-id [boolean]',
  })
  public parseBoolean(val: string): boolean {
    return JSON.parse(val);
  }

  public async run(prams, options?: ICommandOptions): Promise<any> {
    const shouldBackupId = options.backupId ?? false;
    try {
      if (shouldBackupId) {
        const { schema } = getDatabaseConfig();
        await this._mediaModel.sequelize.query(`UPDATE ${schema}.media SET old_id = id`);
      }
      await this.migrateMediaId();
    } catch (e) {
      console.log(e);
    }

    process.exit();
  }

  public getMediaIdFromURL(url): string {
    const matchUUID = url.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
    return matchUUID !== null && matchUUID.length > 0 ? matchUUID[0] : null;
  }

  public async migrateMediaId(): Promise<void> {
    let stop = false;
    let offset = 0;
    const limit = 200;
    let total = 0;
    while (!stop) {
      const images = await this._mediaModel.findAll({
        attributes: ['url', 'id'],
        where: {
          type: MediaType.IMAGE,
          url: {
            [Op.ne]: null,
          },
        },
        limit,
        offset,
      });
      for (const image of images) {
        const newId = this.getMediaIdFromURL(image.url);
        if (newId === null) {
          console.error(`Can not identify UUID from URL ${image.url}`);
          continue;
        }
        console.log(`Changing ID ${image.id} -- to new ID: ${newId}`);
        await this._mediaModel.update(
          { id: newId },
          {
            where: { id: image.id },
          }
        );
        total++;
      }
      if (images.length === 0) stop = true;
      offset = limit + offset;
    }
    console.log(`Migrated all media ID(${total})`);
  }
}
