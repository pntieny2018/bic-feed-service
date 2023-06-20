import { Op } from 'sequelize';
import { Inject, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Command, CommandRunner } from 'nest-commander';
import { PostModel, PostType } from '../database/models/post.model';
import { IUserApplicationService, USER_APPLICATION_TOKEN } from '../modules/v2-user/application';

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

  public async run(): Promise<any> {
    try {
      const posts = await this._postModel.findAll({
        where: {
          content: {
            [Op.like]: `%"url": "data:%`,
          },
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
        await post.update({ content: JSON.stringify(newContent) });
      }
      this._logger.log(`Updated ${posts.length} articles`);
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
    }
    process.exit();
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
