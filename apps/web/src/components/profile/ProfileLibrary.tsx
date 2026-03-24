import { useMemo, useState, useCallback } from 'react';

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
  onOpenAuthor: (authorId: string) => void;
  onOpenPost: (postId: string) => void;
  onSubmitComment: (postId: string, parentId?: string) => void;
  onTabChange: (tab: ProfileTab) => void;
  onToggleComments: (postId: string) => void;
};

const DEFAULT_FOLDER = 'default';

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
    onOpenAuthor,
    onSubmitComment,
    onTabChange,
    onToggleComments,
  } = props;

  const [newFolderName, setNewFolderName] = useState('');

  // Memoize folders computation
  const folders = useMemo(() => {
    const names = new Set<string>([DEFAULT_FOLDER]);
    favorites.forEach((item) => names.add(item.folderName));
    if (favoriteFolderName.trim()) names.add(favoriteFolderName.trim());
    return Array.from(names);
  }, [favoriteFolderName, favorites]);

  const activeFolder = favoriteFolderName.trim() || DEFAULT_FOLDER;

  // Memoize filtered favorites to avoid re-filtering on every render
  const filteredFavorites = useMemo(() => {
    return favorites.filter((item) => item.folderName === activeFolder);
  }, [favorites, activeFolder]);

  // Memoize folder counts to avoid repeated filtering
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of favorites) {
      counts[item.folderName] = (counts[item.folderName] ?? 0) + 1;
    }
    return counts;
  }, [favorites]);

  // Memoize handlers
  const handleTabChange = useCallback((tab: ProfileTab) => {
    onTabChange(tab);
  }, [onTabChange]);

  const handleFolderChange = useCallback((folder: string) => {
    onFavoriteFolderNameChange(folder);
  }, [onFavoriteFolderNameChange]);

  const handleCreateFolder = useCallback(() => {
    const nextFolder = newFolderName.trim();
    if (!nextFolder) return;
    onFavoriteFolderNameChange(nextFolder);
    setNewFolderName('');
  }, [newFolderName, onFavoriteFolderNameChange]);

  return (
    <div className="profile-section">
      <div className="inline-head library-head">
        <div>
          <h3>Content Library</h3>
          <p className="library-subtitle">Switch folders to change what Favorite means across the app.</p>
        </div>
        <div className="segmented-inline">
          <button className={activeTab === 'published' ? 'active' : ''} onClick={() => handleTabChange('published')} type="button">
            Published {posts.length}
          </button>
          <button className={activeTab === 'favorites' ? 'active' : ''} onClick={() => handleTabChange('favorites')} type="button">
            Favorites {favorites.length}
          </button>
        </div>
      </div>

      <div className="folder-manager">
        <div className="folder-list">
          {folders.map((folder) => (
            <button
              className={activeFolder === folder ? 'folder-chip active' : 'folder-chip'}
              key={folder}
              onClick={() => handleFolderChange(folder)}
              type="button"
            >
              {folder}
              <span>{folderCounts[folder] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="folder-create-row">
          <input
            onChange={(event) => setNewFolderName(event.target.value)}
            placeholder="New folder name"
            value={newFolderName}
          />
          <button className="ghost-button" onClick={handleCreateFolder} type="button">Create</button>
        </div>
      </div>

      {activeTab === 'favorites' ? (
        <div className="compact-list">
          {filteredFavorites.length ? (
            filteredFavorites.map((item) => (
              <article className="favorite-card" key={`${item.postId}:${item.folderName}`}>
                <div className="post-meta">
                  <span>{item.folderName}</span>
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                </div>
                <p>{item.post.content}</p>
                <div className="post-actions">
                  <button className="active-action" disabled={busy === `favorite:${item.postId}`} onClick={() => onFavorite(item.postId)} type="button">
                    Remove from folder
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">No favorites in this folder yet.</div>
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
                onOpenAuthor={onOpenAuthor}
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


