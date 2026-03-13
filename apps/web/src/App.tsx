import { DiscoveryPanel } from './components/DiscoveryPanel';
import { FeedPanel } from './components/FeedPanel';
import { LeftSidebar } from './components/LeftSidebar';
import { useDashboard } from './hooks/useDashboard';

export default function App() {
  const { state, actions } = useDashboard();

  return (
    <main className="shell">
      <LeftSidebar
        authForm={state.authForm}
        authMode={state.authMode}
        busy={state.busy}
        currentUser={state.currentUser}
        notifications={state.notifications}
        onAuthFormChange={actions.setAuthForm}
        onAuthModeChange={actions.setAuthMode}
        onLogout={actions.logout}
        onMarkNotificationsRead={() => void actions.markNotificationsRead()}
        onSubmitAuth={() => void actions.submitAuth()}
      />
      <FeedPanel
        busy={state.busy}
        commentDrafts={state.commentDrafts}
        commentsByPost={state.commentsByPost}
        composer={state.composer}
        expandedComments={state.expandedComments}
        feedMode={state.feedMode}
        followingAuthorIds={state.followingAuthorIds}
        likedPostIds={state.likedPostIds}
        message={state.message}
        onCommentDraftChange={(postId, value) =>
          actions.setCommentDrafts((prev) => ({ ...prev, [postId]: value }))
        }
        onComposerChange={actions.setComposer}
        onFeedModeChange={actions.setFeedMode}
        onFollow={(authorId) => void actions.toggleFollow(authorId)}
        onLike={(postId) => void actions.toggleLike(postId)}
        onSubmitComment={(postId) => void actions.submitComment(postId)}
        onSubmitComposer={() => void actions.submitComposer()}
        onToggleComments={actions.toggleComments}
        posts={state.posts}
      />
      <DiscoveryPanel
        busy={state.busy}
        channels={state.channels}
        commentDrafts={state.commentDrafts}
        commentsByPost={state.commentsByPost}
        expandedComments={state.expandedComments}
        followingAuthorIds={state.followingAuthorIds}
        likedPostIds={state.likedPostIds}
        onCommentDraftChange={(postId, value) =>
          actions.setCommentDrafts((prev) => ({ ...prev, [postId]: value }))
        }
        onFollow={(authorId) => void actions.toggleFollow(authorId)}
        onLike={(postId) => void actions.toggleLike(postId)}
        onSearchInputChange={actions.setSearchInput}
        onSearchKeywordChange={(value) => {
          actions.setSearchInput(value);
          actions.setSearchKeyword(value);
        }}
        onSubmitComment={(postId) => void actions.submitComment(postId)}
        onToggleComments={actions.toggleComments}
        searchInput={state.searchInput}
        searchResults={state.searchResults}
        searchTrends={state.searchTrends}
        topics={state.topics}
      />
    </main>
  );
}
