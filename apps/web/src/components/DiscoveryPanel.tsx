import { useEffect, useRef } from 'react';

import { PostCard } from './PostCard';
import { useI18n } from '../i18n';
import type { Channel, Comment, Post, SearchTrend, Topic } from '../types/app';

type DiscoveryPanelProps = {
  busy: string;
  channels: Channel[];
  commentDrafts: Record<string, string>;
  commentsByPost: Record<string, Comment[]>;
  expandedComments: Record<string, boolean>;
  favoritePostIds: Record<string, boolean>;
  followingAuthorIds: Record<string, boolean>;
  likedPostIds: Record<string, boolean>;
  searchInput: string;
  searchKeyword: string;
  searchResults: Post[];
  searchHasMore: boolean;
  searchLoadingMore: boolean;
  searchTrends: SearchTrend[];
  topics: Topic[];
  onCommentDraftChange: (postId: string, value: string) => void;
  onFavorite: (postId: string) => void;
  onFollow: (authorId: string) => void;
  onLike: (postId: string) => void;
  onOpenAuthor: (authorId: string) => void;
  onOpenPost: (postId: string) => void;
  onSearchInputChange: (value: string) => void;
  onSearchKeywordChange: (value: string) => void;
  onLoadMoreSearchResults: () => void;
  onSubmitComment: (postId: string, parentId?: string) => void;
  onToggleComments: (postId: string) => void;
};

export function DiscoveryPanel(props: DiscoveryPanelProps) {
  const { dictionary } = useI18n();
  const texts = dictionary.discovery;
  const loadingTexts = dictionary.notifications;
  const {
    busy,
    channels,
    commentDrafts,
    commentsByPost,
    expandedComments,
    favoritePostIds,
    followingAuthorIds,
    likedPostIds,
    searchInput,
    searchKeyword,
    searchResults,
    searchHasMore,
    searchLoadingMore,
    searchTrends,
    topics,
    onCommentDraftChange,
    onFavorite,
    onFollow,
    onLike,
    onOpenAuthor,
    onSearchInputChange,
    onSearchKeywordChange,
    onLoadMoreSearchResults,
    onSubmitComment,
    onToggleComments,
  } = props;
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && searchHasMore && !searchLoadingMore && searchKeyword.trim()) {
          onLoadMoreSearchResults();
        }
      },
      { threshold: 0.1, rootMargin: '100px' },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [onLoadMoreSearchResults, searchHasMore, searchLoadingMore, searchKeyword]);

  return (
    <section className="panel right-panel">
      <div className="search-box">
        <p className="section-label">{texts.title}</p>
        <div className="search-row">
          <input
            value={searchInput}
            onChange={(event) => onSearchInputChange(event.target.value)}
            placeholder={texts.placeholder}
          />
          <button className="primary-button" onClick={() => onSearchKeywordChange(searchInput.trim())} type="button">
            {texts.search}
          </button>
        </div>
      </div>

      <div className="insight-block">
        <h3>{texts.results}</h3>
        <div className="compact-list">
          {searchResults.length ? (
            <>
              {searchResults.map((post) => (
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
              ))}
              {searchHasMore ? <div ref={sentinelRef} style={{ height: '40px' }} /> : null}
              {searchLoadingMore ? <p>{loadingTexts.loadingMore}</p> : null}
              {!searchHasMore && searchKeyword.trim() ? <p>{loadingTexts.noMore}</p> : null}
            </>
          ) : (
            <p>{texts.resultsEmpty}</p>
          )}
        </div>
      </div>

      <div className="insight-block">
        <h3>{texts.topics}</h3>
        <div className="tag-list">
          {topics.map((item) => (
            <button className="tag" key={item.topic} onClick={() => onSearchKeywordChange(item.topic)} type="button">
              #{item.topic} <span>{item.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="insight-block">
        <h3>{texts.hotSearches}</h3>
        <div className="metric-list">
          {searchTrends.map((item) => (
            <button className="metric-row" key={item.keyword} onClick={() => onSearchKeywordChange(item.keyword)} type="button">
              <span>{item.keyword}</span>
              <strong>{item.count}</strong>
            </button>
          ))}
        </div>
      </div>

      <div className="insight-block">
        <h3>{texts.channelMix}</h3>
        <div className="metric-list">
          {channels.map((item) => (
            <div className="metric-row static" key={item.channel}>
              <span>{item.channel}</span>
              <strong>{item.count}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

