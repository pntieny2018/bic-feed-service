import { Command, CommandRunner, Option } from 'nest-commander';
import { InjectModel } from '@nestjs/sequelize';
import { IMedia, MediaModel, MediaType } from '../database/models/media.model';
import { Op } from 'sequelize';
import { ConfigService } from '@nestjs/config';
import { PostModel } from '../database/models/post.model';
import { CommentModel } from '../database/models/comment.model';
import { getDatabaseConfig } from '../config/database';
import { ExternalService } from '../app/external.service';

interface ICommandOptions {
  backupId: boolean;
}

//npx ts-node -r tsconfig-paths/register src/command/cli.ts migrate:media-id
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
      await this.checkSum();
    } catch (e) {
      console.log(e);
    }

    process.exit();
  }

  public getMediaIdFromURL(url): string {
    const matchUUID = url.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
    return matchUUID !== null && matchUUID.length > 0 ? matchUUID[0] : null;
  }

  public async migrateMediaId(id = null): Promise<void> {
    let stop = false;
    let offset = 0;
    const limit = 200;
    let total = 0;
    const condition = {
      type: MediaType.IMAGE,
      url: {
        [Op.ne]: null,
      },
    };
    if (id) {
      condition['id'] = id;
    }
    while (!stop) {
      const images = await this._mediaModel.findAll({
        attributes: ['url', 'id'],
        where: condition,
        limit,
        offset,
        order: [['id', 'asc']],
      });
      for (const image of images) {
        const newId = this.getMediaIdFromURL(image.url);
        if (newId === null) {
          console.error(`Can not identify UUID from URL ${image.url}`);
          continue;
        }
        if (newId !== image.id) {
          console.log(`Changing ID ${image.id} -- to new ID: ${newId} - URL:${image.url}`);
          await this._mediaModel.update(
            { id: newId },
            {
              where: { id: image.id },
            }
          );
          total++;
        }
      }
      if (images.length === 0) stop = true;
      offset = limit + offset;
    }
    console.log(`Migrated all media ID(${total})`);
  }

  public async checkSum(): Promise<void> {
    const { schema } = getDatabaseConfig();
    const wrongMedia: any = await this._mediaModel.sequelize.query(`
          select id, old_id, url, type
          from ${schema}.media
          where 
          type = 'image' and url is not null
          and id NOT IN (
          select id
          from ${schema}.media
          where 
           url like CONCAT('%',id, '%') AND 
          type = 'image' and url is not null
        )`);
    if (wrongMedia[0].length) {
      for (const media of wrongMedia[0]) {
        console.log('imageID incorrect:', media.id);
        console.log('Fixing...');
        await this.migrateMediaId(media.id);
      }
      console.log('Recheck');
      await this.checkSum();
    } else {
      console.log('No wrong imageID');
    }
  }
}
