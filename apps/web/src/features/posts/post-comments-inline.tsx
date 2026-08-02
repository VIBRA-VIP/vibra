import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mediaSrc } from '@/features/media/services/media-api';
import { cn, maskDisplayName } from '@/utils';
import { addPostCommentRequest, fetchPostComments } from './posts-api';

type Props = {
  postId: string;
  open: boolean;
  onCountChange?: (count: number) => void;
};

export function PostCommentsInline({ postId, open, onCountChange }: Props) {
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [writing, setWriting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const commentsQuery = useQuery({
    queryKey: ['posts', 'comments', postId],
    queryFn: () => fetchPostComments(postId),
    enabled: open,
  });

  useEffect(() => {
    if (commentsQuery.data) {
      onCountChange?.(commentsQuery.data.length);
    }
  }, [commentsQuery.data, onCountChange]);

  useEffect(() => {
    if (!open) {
      setWriting(false);
      setText('');
    }
  }, [open]);

  useEffect(() => {
    if (!writing) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(t);
  }, [writing]);

  const addMutation = useMutation({
    mutationFn: () => addPostCommentRequest(postId, text),
    onSuccess: async () => {
      setText('');
      setWriting(false);
      await queryClient.invalidateQueries({ queryKey: ['posts', 'comments', postId] });
      await queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim() || addMutation.isPending) return;
    addMutation.mutate();
  }

  const comments = commentsQuery.data ?? [];

  return (
    <div
      className={cn(
        'grid transition-[grid-template-rows] duration-300 ease-out',
        open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
      )}
    >
      <div className="min-h-0 overflow-hidden">
        <div className="space-y-3 border-t border-white/5 px-4 pb-4 pt-3">
          {commentsQuery.isLoading ? (
            <p className="py-3 text-center text-xs text-zinc-500">Cargando comentarios...</p>
          ) : comments.length === 0 ? (
            <p className="py-2 text-sm text-zinc-500">Aún no hay comentarios</p>
          ) : (
            <ul className="space-y-3">
              {comments.map((c) => (
                <li key={c.id} className="flex gap-2.5">
                  {c.author.avatarUrl ? (
                    <img
                      src={mediaSrc(c.author.avatarUrl)}
                      alt=""
                      className="mt-0.5 h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-white/10"
                    />
                  ) : (
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-[11px] font-semibold">
                      {c.author.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="rounded-2xl rounded-tl-md bg-white/[0.05] px-3 py-2">
                      <p className="text-[12px] font-semibold text-zinc-100">
                        {maskDisplayName(c.author.displayName)}
                      </p>
                      <p className="mt-0.5 text-sm leading-relaxed text-zinc-300">{c.text}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!writing ? (
            <button
              type="button"
              onClick={() => setWriting(true)}
              className="w-full rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-left text-sm text-zinc-500 transition hover:border-white/20 hover:text-zinc-300"
            >
              Escribir un comentario...
            </button>
          ) : (
            <form onSubmit={onSubmit} className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onBlur={() => {
                  if (!text.trim() && !addMutation.isPending) setWriting(false);
                }}
                placeholder="Escribe un comentario..."
                maxLength={500}
                className="min-w-0 flex-1 rounded-full border border-white/10 bg-vibra-muted/80 px-4 py-2.5 text-sm outline-none transition placeholder:text-zinc-500 focus:border-vibra-pink/50"
              />
              <button
                type="submit"
                disabled={addMutation.isPending || !text.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-vibra-pink text-white transition hover:bg-vibra-pink-hover disabled:opacity-40"
                aria-label="Enviar comentario"
              >
                <Send className="pointer-events-none h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
