import type { Post } from '../../types/app';

type DraftsPageProps = { drafts: Post[] };

export function DraftsPage({ drafts }: DraftsPageProps) {
  return (
    <>
      <div className="toolbar simple-toolbar">
        <div>
          <p className="section-label">Draft Box</p>
          <h2>Unpublished content</h2>
        </div>
      </div>
      <div className="draft-grid">
        {drafts.length ? (
          drafts.map((draft) => (
            <article className="draft-card" key={draft.id}>
              <div className="post-meta">
                <span>Draft</span>
                <span>{new Date(draft.updatedAt).toLocaleString()}</span>
              </div>
              <p>{draft.content}</p>
              <div className="post-footer">
                <span>{draft.id.slice(0, 8)}</span>
                <span>{draft.authorId.slice(0, 8)}</span>
              </div>
            </article>
          ))
        ) : (
          <div className="empty-state">No drafts yet.</div>
        )}
      </div>
    </>
  );
}