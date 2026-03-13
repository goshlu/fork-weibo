import type { Dispatch, SetStateAction } from 'react';

import type { Post } from '../../types/app';

type DraftsPageProps = {
  busy: string;
  draftEdits: Record<string, string>;
  drafts: Post[];
  onDeleteDraft: (postId: string) => void;
  onDraftChange: Dispatch<SetStateAction<Record<string, string>>>;
  onPublishDraft: (postId: string) => void;
  onSaveDraft: (postId: string) => void;
};

export function DraftsPage({ busy, draftEdits, drafts, onDeleteDraft, onDraftChange, onPublishDraft, onSaveDraft }: DraftsPageProps) {
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
              <textarea
                rows={5}
                value={draftEdits[draft.id] ?? ''}
                onChange={(event) => onDraftChange((prev) => ({ ...prev, [draft.id]: event.target.value }))}
              />
              <div className="post-actions">
                <button disabled={busy === `draft-save:${draft.id}`} onClick={() => onSaveDraft(draft.id)} type="button">
                  {busy === `draft-save:${draft.id}` ? 'Saving...' : 'Save'}
                </button>
                <button disabled={busy === `draft-publish:${draft.id}`} onClick={() => onPublishDraft(draft.id)} type="button">
                  {busy === `draft-publish:${draft.id}` ? 'Publishing...' : 'Publish'}
                </button>
                <button disabled={busy === `draft-delete:${draft.id}`} onClick={() => onDeleteDraft(draft.id)} type="button">
                  {busy === `draft-delete:${draft.id}` ? 'Deleting...' : 'Delete'}
                </button>
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
