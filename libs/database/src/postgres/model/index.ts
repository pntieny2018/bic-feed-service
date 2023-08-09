import { CategoryModel } from './category.model';
import { CommentEditedHistoryModel } from './comment-edited-history.model';
import { CommentMediaModel } from './comment-media.model';
import { CommentReactionModel } from './comment-reaction.model';
import { CommentModel } from './comment.model';
import { FailedProcessPostModel } from './failed-process-post.model';
import { FollowModel } from './follow.model';
import { GiphyModel } from './giphy.model';
import { LinkPreviewModel } from './link-preview.model';
import { MediaModel } from './media.model';
import { MentionModel } from './mention.model';
import { PostCategoryModel } from './post-category.model';
import { PostEditedHistoryModel } from './post-edited-history.model';
import { PostGroupModel } from './post-group.model';
import { PostMediaModel } from './post-media.model';
import { PostReactionModel } from './post-reaction.model';
import { PostSeriesModel } from './post-series.model';
import { PostTagModel } from './post-tag.model';
import { PostModel } from './post.model';
import { QuizAnswerModel } from './quiz-answer.model';
import { QuizParticipantAnswerModel } from './quiz-participant-answers.model';
import { QuizParticipantModel } from './quiz-participant.model';
import { QuizQuestionModel } from './quiz-question.model';
import { QuizModel } from './quiz.model';
import { RecentSearchModel } from './recent-search.model';
import { ReportContentDetailModel } from './report-content-detail.model';
import { ReportContentModel } from './report-content.model';
import { TagModel } from './tag.model';
import { UserMarkReadPostModel } from './user-mark-read-post.model';
import { UserNewsFeedModel } from './user-newsfeed.model';
import { UserSavePostModel } from './user-save-post.model';
import { UserSeenPostModel } from './user-seen-post.model';

export default [
  PostModel,
  PostReactionModel,
  PostMediaModel,
  PostGroupModel,
  CommentModel,
  CommentMediaModel,
  CommentReactionModel,
  MediaModel,
  RecentSearchModel,
  UserNewsFeedModel,
  MentionModel,
  FollowModel,
  UserMarkReadPostModel,
  PostEditedHistoryModel,
  CommentEditedHistoryModel,
  UserSeenPostModel,
  GiphyModel,
  CategoryModel,
  PostCategoryModel,
  PostSeriesModel,
  LinkPreviewModel,
  UserSavePostModel,
  ReportContentModel,
  TagModel,
  PostTagModel,
  ReportContentDetailModel,
  FailedProcessPostModel,
  QuizModel,
  QuizQuestionModel,
  QuizAnswerModel,
  QuizParticipantModel,
  QuizParticipantAnswerModel,
];
