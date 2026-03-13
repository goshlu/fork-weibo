import { PostCard } from '../PostCard';
import type { Comment, FavoriteItem, Post, ProfileTab } from '../../types/app';

type ProfileLibraryProps = {
  activeTab: ProfileTab;
  busy: string;
  commentDrafts: Record<string, string>;
  commentsByPost: Record<string, Comment[]>;
  expandedComments: Record<string, boolean>;
  favoriteFolderName: string;
  favoritePostIds: Record<string, boolean>;
  favorites: FavoriteItem[];
  followingAuthorIds: Record<string, boolean>;
  likedPostIds: Record<string, boolean>;
  posts: Post[];
  onCommentDraftChange: (postId: string, value: string) => void;
  onFavorite: (postId: string) => void;
  onFavoriteFolderNameChange: (value: string) => void;
  onFollow: (authorId: string) => void;
  onLike: (postId: string) => void;
  onSubmitComment: (postId: string) => void;
  onTabChange: (tab: ProfileTab) => void;
  onToggleComments: (postId: string) => void;
};

export function ProfileLibrary(props: ProfileLibraryProps) {
  const {
    activeTab,
    busy,
    commentDrafts,
    commentsByPost,
    expandedComments,
    favoriteFolderName,
    favoritePostIds,
    favorites,
    followingAuthorIds,
    likedPostIds,
    posts,
    onCommentDraftChange,
    onFavorite,
    onFavoriteFolderNameChange,
    onFollow,
    onLike,
    onSubmitComment,
    onTabChange,
    onToggleComments,
  } = props;

  return (
    <div className="profile-section">
      <div className="inline-head library-head">
        <div>
          <h3>Content Library</h3>
          <p className="library-subtitle">Favorites use the folder name below when you save from any post card.</p>
        </div>
        <div className="segmented-inline">
          <button className={activeTab === 'published' ? 'active' : ''} onClick={() => onTabChange('published')} type="button">
            Published {posts.length}
          </button>
          <button className={activeTab === 'favorites' ? 'active' : ''} onClick={() => onTabChange('favorites')} type="button">
            Favorites {favorites.length}
          </button>
        </div>
      </div>

      <label className="favorite-folder-field">
        Favorite Folder
        <input onChange={(event) => onFavoriteFolderNameChange(event.target.value)} placeholder="default" value={favoriteFolderName} />
      </label>

      {activeTab === 'favorites' ? (
        <div className="compact-list">
          {favorites.length ? (
            favorites.map((item) => (
              <article className="favorite-card" key={`${item.postId}:${item.folderName}`}>
                <div className="post-meta">
                  <span>{item.folderName}</span>
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                </div>
                <p>{item.post.content}</p>
                <div className="post-actions">
                  <button className="active-action" disabled={busy === `favorite:${item.postId}`} onClick={() => onFavorite(item.postId)} type="button">
                    Unfavorite
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">No favorites yet.</div>
          )}
        </div>
      ) : (
        <div className="post-list compact-list">
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
                onSubmitComment={onSubmitComment}
                onToggleComments={onToggleComments}
                post={post}
              />
            ))
          ) : (
            <div className="empty-state">No published posts yet.</div>
          )}
        </div>
      )}
    </div>
  );
}
