import { PostModel } from '@api/database/models/post.model';
import { getDatabaseConfig } from '@libs/database/postgres/config';
import { MEDIA_SERVICE_TOKEN } from '@libs/service/media/src/interface';
import { MediaService } from '@libs/service/media/src/media.service';
import { Inject, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Command } from 'nest-commander';
import { QueryTypes } from 'sequelize';

@Command({
  name: 'migrate:hls-mimetype-videos',
  description: 'Migration data mimetype of videos from upload service',
})
export class MigrateHlsMimetypeVideosCommand {
  private readonly _logger = new Logger(MigrateHlsMimetypeVideosCommand.name);

  public constructor(
    @InjectModel(PostModel) private _postModel: typeof PostModel,
    @Inject(MEDIA_SERVICE_TOKEN) private readonly _mediaService: MediaService
  ) {}

  public async run(): Promise<any> {
    try {
      this._logger.log('MigrateHlsMimetypeVideosCommand start');
      const { schema } = getDatabaseConfig();

      const limit = 10;
      let offset = 0;

      // count total posts with videos

      const totalPosts = (
        (
          await this._postModel.sequelize.query(
            `SELECT COUNT(*) FROM ${schema}.posts WHERE posts.media_json->>'videos' <> '[]';`,
            {
              type: QueryTypes.SELECT,
            }
          )
        )[0] as any
      ).count;

      while (true) {
        const posts = await this._postModel.sequelize.query(
          `SELECT id, media_json FROM ${schema}.posts WHERE posts.media_json->>'videos' <> '[]' LIMIT ${limit} OFFSET ${offset};`,
          {
            type: QueryTypes.SELECT,
          }
        );

        if (posts.length === 0) {
          break;
        }

        offset += limit;
        this._logger.log(`MigrateHlsMimetypeVideosCommand offset: ${offset}/${totalPosts}`);

        const postVideoMap = posts.reduce((map, post: any) => {
          map[post.media_json.videos[0].id] = post.id;
          return map;
        }, {});

        const videoIds: string[] = posts
          .map((post: any) => {
            return post.media_json.videos.map((video: any) => {
              return video.id;
            });
          })
          .flat();

        const videos = await this._mediaService.findVideosByIds(videoIds);

        for (const video of videos) {
          const postId = postVideoMap[video.id];
          await this._postModel.update(
            {
              mediaJson: {
                videos: [video],
              },
            },
            {
              where: {
                id: postId,
              },
            }
          );
        }
      }
      this._logger.log('MigrateHlsMimetypeVideosCommand done');
    } catch (e) {
      this._logger.error(e);
    }
    process.exit();
  }
}
