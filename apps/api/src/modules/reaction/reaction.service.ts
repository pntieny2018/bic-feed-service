import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { CommentReactionModel } from '../../database/models/comment-reaction.model';
import { PostReactionModel } from '../../database/models/post-reaction.model';
import { isEmpty } from 'lodash';
import { getDatabaseConfig } from '@libs/database/postgres/config';

@Injectable()
export class ReactionService {
  public constructor(
    @InjectConnection()
    private readonly _sequelize: Sequelize
  ) {}

  /**
   * Bind commentsCount info to post
   * @param posts Array of post
   * @returns Promise resolve void
   * @throws HttpException
   */
  public async bindToPosts(posts: any[]): Promise<void> {
    const { schema } = getDatabaseConfig();
    const postIds = [];
    for (const post of posts) {
      postIds.push(post.id);
    }
    if (postIds.length === 0) {
      return;
    }
    const postReactionTable = PostReactionModel.tableName;

    const query = `SELECT 
      ${schema}.${postReactionTable}.post_id as "postId",
         COUNT(${schema}.${postReactionTable}.id ) as total,
         ${schema}.${postReactionTable}.reaction_name as "reactionName",
         MIN(${schema}.${postReactionTable}.created_at) as "date"
      FROM   ${schema}.${postReactionTable}
      WHERE  ${schema}.${postReactionTable}.post_id IN(:postIds)
      GROUP BY ${schema}.${postReactionTable}.post_id, ${schema}.${postReactionTable}.reaction_name
      ORDER BY date ASC`;

    const reactions: any[] = await this._sequelize.query(query, {
      replacements: {
        postIds,
      },
      type: QueryTypes.SELECT,
      raw: true,
    });
    for (const post of posts) {
      post.reactionsCount = reactions.filter((i) => {
        return i.postId === post.id;
      });
    }
  }

  /**
   * Bind reaction to comments
   * @returns Promise resolve void
   * @throws HttpException
   * @param comments
   */
  public async bindToComments(comments: any[]): Promise<void> {
    const { schema } = getDatabaseConfig();
    const commentIds = [];
    for (const comment of comments) {
      commentIds.push(comment.id);
      //push child commentID
      if (comment.child?.list && comment.child?.list.length) {
        for (const cm of comment.child.list) {
          commentIds.push(cm.id);
        }
      }
    }

    if (commentIds.length === 0) return;
    const commentReactionTable = CommentReactionModel.tableName;
    const query = `SELECT 
        ${schema}.${commentReactionTable}.comment_id as "commentId",
         COUNT(${schema}.${commentReactionTable}.id ) as total,
         ${schema}.${commentReactionTable}.reaction_name as "reactionName",
         MIN(${schema}.${commentReactionTable}.created_at) as "date"
      FROM   ${schema}.${commentReactionTable}
      WHERE  ${schema}.${commentReactionTable}.comment_id IN(:commentIds)
      GROUP BY ${schema}.${commentReactionTable}.comment_id, ${schema}.${commentReactionTable}.reaction_name
      ORDER BY date ASC`;
    const reactions: any[] = await this._sequelize.query(query, {
      replacements: {
        commentIds,
      },
      type: QueryTypes.SELECT,
      raw: true,
    });
    for (const comment of comments) {
      const reactionsCount = {};
      reactions
        .filter((i) => {
          return i.commentId === comment.id;
        })
        .forEach((v, i) => (reactionsCount[i] = { [v.reactionName]: parseInt(v.total) }));
      comment.reactionsCount = reactionsCount;
      //Map reaction to child comment
      if (comment.child?.list && comment.child?.list.length) {
        for (const cm of comment.child.list) {
          const childRC = {};
          reactions
            .filter((r) => {
              return r.commentId === cm.id;
            })
            .forEach((v, i) => (childRC[i] = { [v.reactionName]: parseInt(v.total) }));
          cm.reactionsCount = childRC;
        }
      }
    }
  }

  public static transformReactionFormat(
    reactionsCount: Record<string, Record<string, number>> | Record<string, number>[]
  ): Record<string, number>[] {
    if (Array.isArray(reactionsCount)) return reactionsCount;
    return isEmpty(reactionsCount) ? [] : Object.values(reactionsCount);
  }
}
