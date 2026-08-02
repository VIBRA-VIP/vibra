import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mediaSrc } from '@/features/media/services/media-api';
import { addPostCommentRequest, fetchPostComments } from './posts-api';

type Props = {
  postId: string;
  onClose: () => void;
};

export function PostCommentsSheet({ postId, onClose }: Props) {
  const queryClient = useQueryClient();
  const [text, setText] = useState('');

  const commentsQuery = useQuery({
    queryKey: ['posts', 'comments', postId],
    queryFn: () => fetchPostComments(postId),
  });

  const addMutation = useMutation({
    mutationFn: () => addPostCommentRequest(postId, text),
    onSuccess: async () => {
      setText('');
      await queryClient.invalidateQueries({ queryKey: ['posts', 'comments', postId] });
      await queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    addMutation.mutate();
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-vibra-border bg-vibra-elevated sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Comentarios"
      >
        <div className="flex items-center justify-between border-b border-vibra-border px-4 py-3">
          <h3 className="font-display text-base font-semibold">Comentarios</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-zinc-400" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
          {(commentsQuery.data ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">Sé la primera en comentar</p>
          ) : (
            (commentsQuery.data ?? []).map((c) => (
              <div key={c.id} className="flex gap-3">
                {c.author.avatarUrl ? (
                  <img
                    src={mediaSrc(c.author.avatarUrl)}
                    alt=""
                    className="h-8 w-8 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs">
                    {c.author.displayName.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white">
                    {c.author.displayName}{' '}
                    <span className="font-normal text-zinc-500">@{c.author.username}</span>
                  </p>
                  <p className="mt-0.5 text-sm text-zinc-300">{c.text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={onSubmit} className="flex gap-2 border-t border-vibra-border p-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe un comentario..."
            maxLength={500}
            className="min-w-0 flex-1 rounded-xl border border-vibra-border bg-vibra-muted px-3 py-2.5 text-sm outline-none focus:border-vibra-pink/50"
          />
          <button
            type="submit"
            disabled={addMutation.isPending || !text.trim()}
            className="rounded-xl bg-vibra-pink px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
