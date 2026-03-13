import type { Dispatch, SetStateAction } from 'react';

import { PostCard } from './PostCard';
import {
  feedTitles,
  type Comment,
  type ComposerState,
  type FeedMode,
  type Post,
} from '../types/app';

type FeedPanelProps = {
  busy: string;
  composer: ComposerState;
  feedMode: FeedMode;
  message: string;
  posts: Post[];
  likedPostIds: Record<string, boolean>;
  followingAuthorIds: Record<string, boolean>;
  commentsByPost: Record<string, Comment[]>;
  commentDrafts: Record<string, string>;
  expandedComments: Record<string, boolean>;
  onComposerChange: Dispatch<SetStateAction<ComposerState>>;
  onFeedModeChange: (mode: FeedMode) => void;
  onSubmitComposer: () => void;
  onLike: (postId: string) => void;
  onFollow: (authorId: string) => void;
  onToggleComments: (postId: string) => void;
  onCommentDraftChange: (postId: string, value: string) => void;
  onSubmitComment: (postId: string) => void;
};

export function FeedPanel({
  busy,
  composer,
  feedMode,
  message,
  posts,
  likedPostIds,
  followingAuthorIds,
  commentsByPost,
  commentDrafts,
  expandedComments,
  onComposerChange,
  onFeedModeChange,
  onSubmitComposer,
  onLike,
  onFollow,
  onToggleComments,
  onCommentDraftChange,
  onSubmitComment,
}: FeedPanelProps) {
  return (
    <section className="panel center-panel">
      <div className="toolbar">
        <div>
          <p className="section-label">内容台</p>
          <h2>{feedTitles[feedMode]}</h2>
        </div>
        <div className="segmented-control">
          {(['hot', 'following', 'recommended'] as FeedMode[]).map((mode) => (
            <button
              className={feedMode === mode ? 'active' : ''}
              key={mode}
              onClick={() => onFeedModeChange(mode)}
              type="button"
            >
              {feedTitles[mode]}
            </button>
          ))}
        </div>
      </div>

      <form
        className="composer"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmitComposer();
        }}
      >
        <textarea
          value={composer.content}
          onChange={(event) =>
            onComposerChange((prev) => ({ ...prev, content: event.target.value }))
          }
          placeholder="分享新内容，试试带 #话题，例如 #AI #Tech"
          rows={5}
        />
        <div className="composer-footer">
          <select
            value={composer.status}
            onChange={(event) =>
              onComposerChange((prev) => ({
                ...prev,
                status: event.target.value as 'draft' | 'published',
              }))
            }
          >
            <option value="published">直接发布</option>
            <option value="draft">保存草稿</option>
          </select>
          <button className="primary-button" disabled={busy === 'composer'} type="submit">
            {busy === 'composer' ? '提交中...' : '发布内容'}
          </button>
        </div>
      </form>

      {message ? <div className="message-bar">{message}</div> : null}

      <div className="post-list">
        {posts.length ? (
          posts.map((post) => (
            <PostCard
              busy={busy}
              commentDraft={commentDrafts[post.id] ?? ''}
              comments={commentsByPost[post.id] ?? []}
              commentsOpen={expandedComments[post.id] ?? false}
              followed={followingAuthorIds[post.authorId] ?? false}
              key={post.id}
              liked={likedPostIds[post.id] ?? false}
              onCommentDraftChange={onCommentDraftChange}
              onFollow={onFollow}
              onLike={onLike}
              onSubmitComment={onSubmitComment}
              onToggleComments={onToggleComments}
              post={post}
            />
          ))
        ) : (
          <div className="empty-state">当前流里还没有内容。</div>
        )}
      </div>
    </section>
  );
}
