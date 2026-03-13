import { CenterPanel } from './components/CenterPanel';
import { DiscoveryPanel } from './components/DiscoveryPanel';
import { LeftSidebar } from './components/LeftSidebar';
import { useDashboard } from './hooks/useDashboard';

export default function App() {
  const dashboard = useDashboard();
  const { state, actions } = dashboard;

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
        onViewModeChange={actions.setViewMode}
        viewMode={state.viewMode}
      />
      <CenterPanel dashboard={dashboard} />
      <DiscoveryPanel
        busy={state.busy}
        channels={state.channels}
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
