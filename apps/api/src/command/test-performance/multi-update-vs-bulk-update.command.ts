import { Command, CommandRunner } from 'nest-commander';
import { PostPrivacy, PostStatus, PostType } from '../../database/models/post.model';
import { SearchService } from '../../modules/search/search.service';

@Command({ name: 'es-verify-bulk-update', description: 'Multi update vs bulk update' })
export class MultiUpdateVsBulkUpdateCommand implements CommandRunner {
  public constructor(private readonly _postSearchService: SearchService) {}

  public async run(): Promise<any> {
    try {
      const posts = [
        {
          id: '3b2299bc-b3a8-42ee-a1c3-9bc19da26936',
          commentsCount: 0,
          totalUsersSeen: 2,
          isImportant: false,
          importantExpiredAt: null,
          canComment: true,
          canReact: true,
          isHidden: false,
          isReported: false,
          content: null,
          title: 'archive series',
          type: PostType.SERIES,
          summary: '',
          lang: 'en',
          giphyId: null,
          privacy: PostPrivacy.PRIVATE,
          hashtagsJson: null,
          tagsJson: null,
          createdBy: '6235bc91-2255-4f4b-bcfa-bebcd24e27ac',
          updatedBy: '6235bc91-2255-4f4b-bcfa-bebcd24e27ac',
          linkPreviewId: null,
          cover: 'a91b1eec-077f-40d4-be93-fcbb80599c83',
          status: PostStatus.PUBLISHED,
          publishedAt: null,
          errorLog: null,
          createdAt: new Date('2023-01-17T10:00:09.425Z'),
          updatedAt: new Date('2023-02-06T02:58:03.330Z'),
          deletedAt: null,
        },
        {
          id: 'c9a179e3-1245-48b8-85d6-7ea5ef13bc3a',
          commentsCount: 0,
          totalUsersSeen: 2,
          isImportant: false,
          importantExpiredAt: null,
          canComment: true,
          canReact: true,
          isHidden: false,
          isReported: false,
          content:
            '[{"type":"p","children":[{"text":"archive 1 param"}],"id":"oLiGr2HSs574RKoqE-sg9"}]',
          title: 'archive 1',
          type: PostType.ARTICLE,
          summary: 'archive 1 test',
          lang: null,
          giphyId: null,
          privacy: PostPrivacy.OPEN,
          hashtagsJson: [],
          tagsJson: [],
          createdBy: '6235bc91-2255-4f4b-bcfa-bebcd24e27ac',
          updatedBy: '6235bc91-2255-4f4b-bcfa-bebcd24e27ac',
          linkPreviewId: null,
          cover: '37e558f6-9783-4375-8084-986755eb1dc2',
          status: PostStatus.PUBLISHED,
          publishedAt: null,
          errorLog: null,
          createdAt: new Date('2023-01-17T10:25:24.344Z'),
          updatedAt: new Date('2023-02-06T03:10:19.754Z'),
          deletedAt: null,
        },
        {
          id: '67a9a5e5-2cc4-4bcf-8c78-c88d6c8437f7',
          commentsCount: 0,
          totalUsersSeen: 1,
          isImportant: false,
          importantExpiredAt: null,
          canComment: true,
          canReact: true,
          isHidden: false,
          isReported: false,
          content:
            '[{"type":"p","children":[{"text":"archive 2 content st"}],"id":"MU2xktkNBP8pLFeprI3HW"}]',
          title: 'archive 2',
          type: PostType.ARTICLE,
          summary: 'archive 2 test',
          lang: null,
          giphyId: null,
          privacy: PostPrivacy.OPEN,
          hashtagsJson: [],
          tagsJson: [],
          createdBy: '6235bc91-2255-4f4b-bcfa-bebcd24e27ac',
          updatedBy: '6235bc91-2255-4f4b-bcfa-bebcd24e27ac',
          linkPreviewId: null,
          cover: 'f8212e5d-9ccd-4034-96e0-9f8e75e558be',
          status: PostStatus.PUBLISHED,
          publishedAt: null,
          errorLog: null,
          createdAt: new Date('2023-01-17T10:26:50.174Z'),
          updatedAt: new Date('2023-01-17T10:34:18.635Z'),
          deletedAt: null,
        },
      ];
      const mappingPostIdGroupIds = {
        '386132bb-2d74-428c-99a7-03ecfe397de3': [],
        'b74913ac-024e-4fcd-b8dc-38b5612015cc': ['5e1cedd2-90d1-4c88-824d-c04b6e1e6bbc'],
        '3b2299bc-b3a8-42ee-a1c3-9bc19da26936': ['5e1cedd2-90d1-4c88-824d-c04b6e1e6bbc'],
        'c9a179e3-1245-48b8-85d6-7ea5ef13bc3a': ['5e1cedd2-90d1-4c88-824d-c04b6e1e6bbc'],
        '67a9a5e5-2cc4-4bcf-8c78-c88d6c8437f7': [],
      };

      // // restore group
      // Object.keys(mappingPostIdGroupIds).forEach((postId) => {
      //   mappingPostIdGroupIds[postId] = mappingPostIdGroupIds[postId].concat(
      //     '3db7a7ab-39a8-42cf-a4d8-e8984d26009e'
      //   );
      // });
      //
      // // old way
      // for (const post of posts) {
      //   if (post.status === PostStatus.PUBLISHED) {
      //     await this._postSearchService.updateAttributePostToSearch(post, {
      //       groupIds: mappingPostIdGroupIds[post.id],
      //     });
      //   }
      // }

      // new way
      await this._postSearchService.updateAttributePostsToSearch(
        posts,
        posts.map((post) => ({ groupIds: mappingPostIdGroupIds[post.id] }))
      );
    } catch (e) {
      console.log(e);
    }
    process.exit();
  }
}
