import { PostCard } from './PostCard';
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
  searchResults: Post[];
  searchTrends: SearchTrend[];
  topics: Topic[];
  onCommentDraftChange: (postId: string, value: string) => void;
  onFavorite: (postId: string) => void;
  onFollow: (authorId: string) => void;
  onLike: (postId: string) => void;
  onSearchInputChange: (value: string) => void;
  onSearchKeywordChange: (value: string) => void;
  onSubmitComment: (postId: string) => void;
  onToggleComments: (postId: string) => void;
};

export function DiscoveryPanel(props: DiscoveryPanelProps) {
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
    searchResults,
    searchTrends,
    topics,
    onCommentDraftChange,
    onFavorite,
    onFollow,
    onLike,
    onSearchInputChange,
    onSearchKeywordChange,
    onSubmitComment,
    onToggleComments,
  } = props;

  return (
    <section className="panel right-panel">
      <div className="search-box">
        <p className="section-label">Search and Discover</p>
        <div className="search-row">
          <input
            value={searchInput}
            onChange={(event) => onSearchInputChange(event.target.value)}
            placeholder="Search keywords like ai or travel"
          />
          <button className="primary-button" onClick={() => onSearchKeywordChange(searchInput.trim())} type="button">
            Search
          </button>
        </div>
      </div>

      <div className="insight-block">
        <h3>Search Results</h3>
        <div className="compact-list">
          {searchResults.length ? (
            searchResults.map((post) => (
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
                onSubmitComment={onSubmitComment}
                onToggleComments={onToggleComments}
                post={post}
              />
            ))
          ) : (
            <p>Run a keyword search to populate this panel.</p>
          )}
        </div>
      </div>

      <div className="insight-block">
        <h3>Trending Topics</h3>
        <div className="tag-list">
          {topics.map((item) => (
            <button className="tag" key={item.topic} onClick={() => onSearchKeywordChange(item.topic)} type="button">
              #{item.topic} <span>{item.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="insight-block">
        <h3>Hot Searches</h3>
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
        <h3>Channel Mix</h3>
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
