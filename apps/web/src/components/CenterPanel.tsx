import { DraftsPage } from './pages/DraftsPage';
import { FeedPage } from './pages/FeedPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { PostPage } from './pages/PostPage';
import { ProfilePage } from './pages/ProfilePage';
import { UserPage } from './pages/UserPage';
import type { DashboardReturn } from '../hooks/useDashboard';

type CenterPanelProps = { dashboard: DashboardReturn };

export function CenterPanel({ dashboard }: CenterPanelProps) {
  const { state, actions } = dashboard;

  return (
    <section className="panel center-panel">
      {state.viewMode === 'feed' ? (
        <FeedPage
          busy={state.busy}
          commentDrafts={state.commentDrafts}
          commentsByPost={state.commentsByPost}
          composer={state.composer}
          expandedComments={state.expandedComments}
          favoritePostIds={state.favoritePostIds}
          feedMode={state.feedMode}
          hasMore={state.feedHasMore}
          followingAuthorIds={state.followingAuthorIds}
          likedPostIds={state.likedPostIds}
          loadingMore={state.feedLoadingMore}
          message={state.message}
          onCommentDraftChange={(postId, value) => actions.setCommentDrafts((prev) => ({ ...prev, [postId]: value }))}
          onComposerChange={actions.setComposer}
          onFavorite={(postId) => void actions.toggleFavorite(postId)}
          onFeedModeChange={actions.setFeedMode}
          onFollow={(authorId) => void actions.toggleFollow(authorId)}
          onLike={(postId) => void actions.toggleLike(postId)}
          onLoadMore={() => void actions.loadMoreFeed()}
          onOpenAuthor={(authorId) => void actions.openUserProfile(authorId)}
          onOpenPost={(postId) => void actions.openPostDetail(postId)}
          onSubmitComment={(postId, parentId) => void actions.submitComment(postId, parentId)}
          onSubmitComposer={() => void actions.submitComposer()}
          onToggleComments={actions.toggleComments}
          posts={state.posts}
        />
      ) : null}

      {state.viewMode === 'profile' ? (
        <ProfilePage
          avatarPreview={state.avatarPreview}
          busy={state.busy}
          commentDrafts={state.commentDrafts}
          commentsByPost={state.commentsByPost}
          expandedComments={state.expandedComments}
          favoriteFolderName={state.favoriteFolderName}
          favoritePostIds={state.favoritePostIds}
          favorites={state.favorites}
          followingAuthorIds={state.followingAuthorIds}
          likedPostIds={state.likedPostIds}
          onCommentDraftChange={(postId, value) => actions.setCommentDrafts((prev) => ({ ...prev, [postId]: value }))}
          onFavorite={(postId) => void actions.toggleFavorite(postId)}
          onFavoriteFolderNameChange={actions.setFavoriteFolderName}
          onFollow={(authorId) => void actions.toggleFollow(authorId)}
          onLike={(postId) => void actions.toggleLike(postId)}
          onOpenAuthor={(authorId) => void actions.openUserProfile(authorId)}
          onOpenPost={(postId) => void actions.openPostDetail(postId)}
          onProfileFormChange={actions.setProfileForm}
          onSaveProfile={() => void actions.saveProfile()}
          onSubmitComment={(postId, parentId) => void actions.submitComment(postId, parentId)}
          onToggleComments={actions.toggleComments}
          onUploadAvatar={(file) => void actions.uploadAvatar(file)}
          posts={state.profilePosts}
          profile={state.profile}
          profileForm={state.profileForm}
        />
      ) : null}

      {state.viewMode === 'user' ? (
        <UserPage
          busy={state.busy}
          commentDrafts={state.commentDrafts}
          commentsByPost={state.commentsByPost}
          expandedComments={state.expandedComments}
          favoritePostIds={state.favoritePostIds}
          followingAuthorIds={state.followingAuthorIds}
          likedPostIds={state.likedPostIds}
          onCommentDraftChange={(postId, value) => actions.setCommentDrafts((prev) => ({ ...prev, [postId]: value }))}
          onFavorite={(postId) => void actions.toggleFavorite(postId)}
          onFollow={(authorId) => void actions.toggleFollow(authorId)}
          onLike={(postId) => void actions.toggleLike(postId)}
          onOpenAuthor={(authorId) => void actions.openUserProfile(authorId)}
          onOpenPost={(postId) => void actions.openPostDetail(postId)}
          onSubmitComment={(postId, parentId) => void actions.submitComment(postId, parentId)}
          onToggleComments={actions.toggleComments}
          posts={state.viewedUserPosts}
          profile={state.viewedProfile}
        />
      ) : null}

      {state.viewMode === 'post' ? (
        <PostPage
          busy={state.busy}
          commentDraft={state.postDetail ? state.commentDrafts[state.postDetail.id] ?? '' : ''}
          comments={state.postDetail ? state.commentsByPost[state.postDetail.id] ?? [] : []}
          favoritePostIds={state.favoritePostIds}
          followingAuthorIds={state.followingAuthorIds}
          highlightedCommentId={state.postDetailHighlightCommentId}
          likedPostIds={state.likedPostIds}
          onCommentDraftChange={(postId, value) => actions.setCommentDrafts((prev) => ({ ...prev, [postId]: value }))}
          onFavorite={(postId) => void actions.toggleFavorite(postId)}
          onFollow={(authorId) => void actions.toggleFollow(authorId)}
          onLike={(postId) => void actions.toggleLike(postId)}
          onOpenAuthor={(authorId) => void actions.openUserProfile(authorId)}
          onOpenPost={(postId) => void actions.openPostDetail(postId)}
          onSubmitComment={(postId, parentId) => void actions.submitComment(postId, parentId)}
          onToggleComments={actions.toggleComments}
          post={state.postDetail}
        />
      ) : null}

      {state.viewMode === 'drafts' ? (
        <DraftsPage
          busy={state.busy}
          draftEdits={state.draftEdits}
          drafts={state.drafts}
          onDeleteDraft={(postId) => void actions.deleteDraft(postId)}
          onDraftChange={actions.setDraftEdits}
          onPublishDraft={(postId) => void actions.publishDraft(postId)}
          onSaveDraft={(postId) => void actions.saveDraft(postId)}
        />
      ) : null}

      {state.viewMode === 'notifications' ? (
        <NotificationsPage
          notifications={state.notifications}
          onMarkAllRead={() => void actions.markNotificationsRead()}
          onMarkOneRead={(id: string) => void actions.markOneNotificationRead(id)}
          onOpenNotification={(notification) => void actions.openNotification(notification)}
          onLoadMore={() => void actions.loadMoreNotifications()}
          hasMore={state.notificationHasMore}
          loadingMore={state.loadingMore}
        />
      ) : null}
    </section>
  );
}

