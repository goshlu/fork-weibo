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
          feedMode={state.feedMode}
          followingAuthorIds={state.followingAuthorIds}
          likedPostIds={state.likedPostIds}
          message={state.message}
          onCommentDraftChange={(postId, value) => actions.setCommentDrafts((prev) => ({ ...prev, [postId]: value }))}
          onComposerChange={actions.setComposer}
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
          busy={state.busy}
          commentDrafts={state.commentDrafts}
          commentsByPost={state.commentsByPost}
          expandedComments={state.expandedComments}
          followingAuthorIds={state.followingAuthorIds}
          likedPostIds={state.likedPostIds}
          onCommentDraftChange={(postId, value) => actions.setCommentDrafts((prev) => ({ ...prev, [postId]: value }))}
          onFollow={(authorId) => void actions.toggleFollow(authorId)}
          onLike={(postId) => void actions.toggleLike(postId)}
          onSubmitComment={(postId) => void actions.submitComment(postId)}
          onToggleComments={actions.toggleComments}
          posts={state.profilePosts}
          profile={state.profile}
        />
      ) : null}
      {state.viewMode === 'drafts' ? <DraftsPage drafts={state.drafts} /> : null}
      {state.viewMode === 'notifications' ? <NotificationsPage notifications={state.notifications} onMarkAllRead={() => void actions.markNotificationsRead()} /> : null}
    </section>
  );
}