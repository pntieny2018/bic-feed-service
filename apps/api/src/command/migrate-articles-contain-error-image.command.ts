import { Op, QueryTypes } from 'sequelize';
import { Inject, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { getDatabaseConfig } from '../config/database';
import { Command, CommandRunner, Option } from 'nest-commander';
import { PostModel, PostType } from '../database/models/post.model';
import { IUserApplicationService, USER_APPLICATION_TOKEN } from '../modules/v2-user/application';

interface ICommandOptions {
  rollback: boolean;
}
@Command({
  name: 'migrate:articles-contain-error-image',
  description: 'Migrate the articles contain the error image (base64)',
})
export class MigrateArticlesContainErrorImageCommand implements CommandRunner {
  private _logger = new Logger(MigrateArticlesContainErrorImageCommand.name);

  public constructor(
    @InjectModel(PostModel)
    private readonly _postModel: typeof PostModel,
    @Inject(USER_APPLICATION_TOKEN)
    private readonly _userApplicationService: IUserApplicationService
  ) {}

  public static overrideUrl = (node: Record<string, any>): Record<string, any> => {
    if (node?.type === 'img' && node.url) {
      if (node.url.startsWith('data')) {
        return {
          ...node,
          url: '',
        };
      }
    }
    return node;
  };

  @Option({
    flags: '-r, --rollback [boolean]',
  })
  public async run(params: string[], options?: ICommandOptions): Promise<any> {
    if (Boolean(options.rollback)) await this.rollBack();
    else await this.migrateContent();
    process.exit();
  }

  public async rollBack(): Promise<any> {
    try {
      const { schema } = getDatabaseConfig();
      const rollBackPosts = await this._postModel.sequelize.query(
        `
        SELECT
          "id"
        FROM
          ${schema}."posts" AS "PostModel"
        WHERE ("PostModel"."deleted_at" IS NULL
          AND(("PostModel"."old_content" LIKE :optionRaw
            OR "PostModel"."old_content" LIKE :optionFormat)
          AND "PostModel"."type" = 'ARTICLE'))`,
        {
          replacements: {
            optionRaw: '%"url":"data:%',
            optionFormat: '%"url":" data:%',
          },
          type: QueryTypes.SELECT,
        }
      );
      if (rollBackPosts) {
        const postIds = rollBackPosts.map((post) => post['id']);
        await this._postModel.sequelize.query(
          `UPDATE ${schema}.posts SET content = old_content WHERE id IN (:ids)`,
          {
            replacements: {
              ids: postIds,
            },
            type: QueryTypes.UPDATE,
          }
        );
        this._logger.log(`Rollback ${postIds.length} articles`);
      } else {
        this._logger.log(`Not found data to rollback`);
      }
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
    }
  }

  public async migrateContent(): Promise<any> {
    const { schema } = getDatabaseConfig();
    try {
      const posts = await this._postModel.findAll({
        where: {
          [Op.or]: [
            {
              content: {
                [Op.like]: `%"url": "data:%`,
              },
            },
            {
              content: {
                [Op.like]: `%"url":"data:%`,
              },
            },
          ],
          type: PostType.ARTICLE,
        },
      });

      if (!posts || posts.length === 0) {
        this._logger.log(`Not found error articles`);
        return;
      }

      const userIdsNeedToFind = posts.map((post) => post.createdBy);

      const users = await this._userApplicationService.findAllByIds(userIdsNeedToFind, {
        withGroupJoined: false,
      });

      const jsonPosts = posts.map((post) => ({
        id: post.id,
        type: post.type,
        title: post.title,
        createdBy: post.createdBy,
        actor: {
          username: users.find((user) => user.id === post.createdBy)?.username,
          email: users.find((user) => user.id === post.createdBy)?.email,
          fullname: users.find((user) => user.id === post.createdBy)?.fullname,
        },
      }));

      this._logger.log(JSON.stringify(jsonPosts));

      for (const post of posts) {
        const newContent = JSON.parse(post.content).map((node) =>
          this._recursivelyUpdateChildrenProperties(
            node,
            MigrateArticlesContainErrorImageCommand.overrideUrl
          )
        );
        await this._postModel.sequelize.query(
          `UPDATE ${schema}.posts SET old_content = content, content = :content WHERE id = :postId`,
          {
            replacements: {
              postId: post.id,
              content: JSON.stringify(newContent),
            },
            type: QueryTypes.UPDATE,
          }
        );
      }
      this._logger.log(`Updated and backup ${posts.length} articles`);
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
    }
  }

  private _recurseChildren(children: any, func: any): any {
    if (!children) return;
    const newChildren = children.map((child) => {
      const newChild = func(child);
      if (child.hasOwnProperty('children') && child.children.length > 0) {
        return {
          ...child,
          ...newChild,
          children: this._recurseChildren(newChild.children, func),
        };
      }
      return {
        ...child,
        ...newChild,
      };
    });
    return newChildren;
  }

  private _recursivelyUpdateChildrenProperties(node: any, func: any): any {
    const newNode = func(node);
    if (!node.hasOwnProperty('children') || !node.children?.length) return newNode;
    const newNodeChildren = newNode.children.map((child) => {
      const newChild = func(child);
      return {
        ...child,
        ...newChild,
        ...(Boolean(newChild?.children) && {
          children: this._recurseChildren(newChild.children, func),
        }),
      };
    });
    return { ...newNode, children: newNodeChildren };
  }
}
