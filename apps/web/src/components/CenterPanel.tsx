import { DraftsPage } from './pages/DraftsPage';
import { FeedPage } from './pages/FeedPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
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
          followingAuthorIds={state.followingAuthorIds}
          likedPostIds={state.likedPostIds}
          message={state.message}
          onCommentDraftChange={(postId, value) => actions.setCommentDrafts((prev) => ({ ...prev, [postId]: value }))}
          onComposerChange={actions.setComposer}
          onFavorite={(postId) => void actions.toggleFavorite(postId)}
          onFeedModeChange={actions.setFeedMode}
          onFollow={(authorId) => void actions.toggleFollow(authorId)}
          onLike={(postId) => void actions.toggleLike(postId)}
          onSubmitComment={(postId) => void actions.submitComment(postId)}
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
          onProfileFormChange={actions.setProfileForm}
          onSaveProfile={() => void actions.saveProfile()}
          onSubmitComment={(postId) => void actions.submitComment(postId)}
          onToggleComments={actions.toggleComments}
          onUploadAvatar={(file) => void actions.uploadAvatar(file)}
          posts={state.profilePosts}
          profile={state.profile}
          profileForm={state.profileForm}
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
        />
      ) : null}
    </section>
  );
}
