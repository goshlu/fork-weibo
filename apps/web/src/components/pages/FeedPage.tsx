import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { PostCard } from '../PostCard';
import { formatTemplate, useI18n } from '../../i18n';
import { type Comment, type ComposerState, type FeedMode, type Post } from '../../types/app';

type FeedPageProps = {
  busy: string;
  composer: ComposerState;
  feedMode: FeedMode;
  message: string;
  posts: Post[];
  likedPostIds: Record<string, boolean>;
  favoritePostIds: Record<string, boolean>;
  followingAuthorIds: Record<string, boolean>;
  commentsByPost: Record<string, Comment[]>;
  commentDrafts: Record<string, string>;
  expandedComments: Record<string, boolean>;
  onComposerChange: Dispatch<SetStateAction<ComposerState>>;
  onFeedModeChange: (mode: FeedMode) => void;
  onOpenAuthor: (authorId: string) => void;
  onOpenPost: (postId: string) => void;
  onSubmitComposer: () => void;
  onLike: (postId: string) => void;
  onFavorite: (postId: string) => void;
  onFollow: (authorId: string) => void;
  onToggleComments: (postId: string) => void;
  onCommentDraftChange: (postId: string, value: string) => void;
  onSubmitComment: (postId: string, parentId?: string) => void;
};

type LocalImagePreviewProps = {
  file: File;
  alt: string;
};

function LocalImagePreview({ file, alt }: LocalImagePreviewProps) {
  const [src, setSrc] = useState('');

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setSrc(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  if (!src) return null;
  return <img alt={alt} className="composer-preview-image" src={src} />;
}

export function FeedPage(props: FeedPageProps) {
  const { dictionary } = useI18n();
  const feedTitles = dictionary.feedTitles;
  const texts = dictionary.feedPage;
  const {
    busy,
    composer,
    feedMode,
    message,
    posts,
    likedPostIds,
    favoritePostIds,
    followingAuthorIds,
    commentsByPost,
    commentDrafts,
    expandedComments,
    onComposerChange,
    onFeedModeChange,
    onOpenAuthor,
    onSubmitComposer,
    onLike,
    onFavorite,
    onFollow,
    onToggleComments,
    onCommentDraftChange,
    onSubmitComment,
  } = props;

  return (
    <>
      <div className="toolbar">
        <div>
          <p className="section-label">{texts.contentSquare}</p>
          <h2>{feedTitles[feedMode]}</h2>
        </div>
        <div className="segmented-control">
          {(['hot', 'following', 'recommended'] as FeedMode[]).map((mode) => (
            <button className={feedMode === mode ? 'active' : ''} key={mode} onClick={() => onFeedModeChange(mode)} type="button">
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
        <label className="composer-upload" htmlFor="composer-images">
          <span>{texts.addImages} ({composer.images.length}/9)</span>
          <input
            accept="image/*"
            id="composer-images"
            multiple
            onChange={(event) => {
              const nextFiles = Array.from(event.target.files ?? []).slice(0, 9);
              onComposerChange((prev) => ({
                ...prev,
                images: [...prev.images, ...nextFiles].slice(0, 9),
              }));
              event.currentTarget.value = '';
            }}
            type="file"
          />
        </label>
        <textarea
          value={composer.content}
          onChange={(event) => onComposerChange((prev) => ({ ...prev, content: event.target.value }))}
          placeholder={texts.sharePlaceholder}
          rows={5}
        />
        {composer.images.length ? (
          <div className="composer-preview-grid">
            {composer.images.map((image, index) => (
              <div className="composer-preview-card" key={`${image.name}-${image.lastModified}-${index}`}>
                <LocalImagePreview alt={image.name || formatTemplate(texts.uploadLabel + ' {index}', { index: index + 1 })} file={image} />
                <button
                  className="ghost-button composer-preview-remove"
                  onClick={() =>
                    onComposerChange((prev) => ({
                      ...prev,
                      images: prev.images.filter((_, imageIndex) => imageIndex !== index),
                    }))
                  }
                  type="button"
                >
                  {texts.remove}
                </button>
              </div>
            ))}
          </div>
        ) : null}
        <div className="composer-footer">
          <select
            value={composer.status}
            onChange={(event) => onComposerChange((prev) => ({ ...prev, status: event.target.value as 'draft' | 'published' }))}
          >
            <option value="published">{texts.publishNow}</option>
            <option value="draft">{texts.saveDraft}</option>
          </select>
          <button className="primary-button" disabled={busy === 'composer'} type="submit">
            {busy === 'composer' ? texts.submitting : texts.submitPost}
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
              favorited={favoritePostIds[post.id] ?? false}
              followed={followingAuthorIds[post.authorId] ?? false}
              key={post.id}
              liked={likedPostIds[post.id] ?? false}
              onCommentDraftChange={onCommentDraftChange}
              onFavorite={onFavorite}
              onFollow={onFollow}
              onLike={onLike}
              onOpenAuthor={onOpenAuthor}
              onSubmitComment={onSubmitComment}
              onToggleComments={onToggleComments}
              post={post}
            />
          ))
        ) : (
          <div className="empty-state">{texts.empty}</div>
        )}
      </div>
    </>
  );
}


