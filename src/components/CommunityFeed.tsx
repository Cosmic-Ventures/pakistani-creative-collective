"use client";

import { useActionState, useState, useTransition } from "react";
import { toggleReaction, addComment, reportComment, type CommentResult } from "@/lib/community-actions";
import { POST_CATEGORY_LABELS, REACTION_LABELS, REACTION_EMOJI, COMMENT_MAX_WORDS } from "@/lib/community-constants";
import type { PostCategory, ReactionType } from "@prisma/client";

const REACTION_TYPES = Object.keys(REACTION_LABELS) as ReactionType[];

type CommentT = {
  id: string;
  body: string;
  createdAt: Date;
  creative: { firstName: string; lastName: string; roles: string[] };
};

type PostT = {
  id: string;
  category: PostCategory;
  title: string;
  body: string;
  region: string | null;
  expiresAt: Date | null;
  link: string | null;
  createdAt: Date;
  creative: { firstName: string; lastName: string; roles: string[]; slug: string };
  reactions: { creativeId: string; type: ReactionType }[];
  comments: CommentT[];
};

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function CommunityFeed({ posts, myCreativeId }: { posts: PostT[]; myCreativeId: string | null }) {
  if (posts.length === 0) {
    return <p className="text-center text-brand-brown/50 py-16">No posts yet — be the first to share something.</p>;
  }

  return (
    <div className="space-y-5">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} myCreativeId={myCreativeId} />
      ))}
    </div>
  );
}

function PostCard({ post, myCreativeId }: { post: PostT; myCreativeId: string | null }) {
  const [isPending, startTransition] = useTransition();
  const [showComments, setShowComments] = useState(false);
  const myReaction = myCreativeId ? post.reactions.find((r) => r.creativeId === myCreativeId)?.type : undefined;

  const counts = REACTION_TYPES.reduce<Record<ReactionType, number>>((acc, t) => {
    acc[t] = post.reactions.filter((r) => r.type === t).length;
    return acc;
  }, {} as Record<ReactionType, number>);

  function react(type: ReactionType) {
    if (!myCreativeId) return;
    startTransition(() => {
      toggleReaction(post.id, type);
    });
  }

  return (
    <div className="bg-white border border-brand-green/10 rounded-xl p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="text-[11px] uppercase font-semibold bg-brand-mint/30 border border-brand-mint text-brand-green px-2.5 py-1 rounded-full">
          {POST_CATEGORY_LABELS[post.category]}
        </span>
        <span className="text-xs text-brand-brown/40 shrink-0">{formatDate(post.createdAt)}</span>
      </div>

      <h3 className="font-heading font-bold text-lg text-brand-brown mb-1">{post.title}</h3>
      <p className="text-xs text-brand-brown/50 mb-3">
        {post.creative.firstName} {post.creative.lastName}
        {post.creative.roles.length > 0 && ` · ${post.creative.roles[0]}`}
      </p>

      <p className="text-sm text-brand-brown/80 leading-relaxed whitespace-pre-wrap mb-3">{post.body}</p>

      {(post.region || post.expiresAt) && (
        <p className="text-xs text-brand-brown/50 mb-3">
          {post.region && <span>{post.region}</span>}
          {post.region && post.expiresAt && <span> · </span>}
          {post.expiresAt && <span>Through {formatDate(post.expiresAt)}</span>}
        </p>
      )}

      {post.link && (
        <a
          href={post.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm text-brand-green underline underline-offset-2 hover:no-underline mb-3"
        >
          View link →
        </a>
      )}

      <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-brand-green/10">
        {REACTION_TYPES.map((type) => (
          <button
            key={type}
            disabled={!myCreativeId || isPending}
            onClick={() => react(type)}
            title={REACTION_LABELS[type]}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              myReaction === type
                ? "bg-brand-green text-brand-cream border-brand-green"
                : "bg-white text-brand-brown/70 border-brand-green/20 hover:border-brand-green/50"
            }`}
          >
            {REACTION_EMOJI[type]} {counts[type] > 0 && counts[type]}
          </button>
        ))}
        <button
          onClick={() => setShowComments((s) => !s)}
          className="text-xs px-2.5 py-1 rounded-full border border-brand-green/20 text-brand-brown/70 hover:border-brand-green/50 transition-colors ml-auto"
        >
          {post.comments.length} comment{post.comments.length !== 1 ? "s" : ""}
        </button>
      </div>

      {showComments && (
        <div className="mt-4 pt-4 border-t border-brand-green/10 space-y-3">
          {post.comments.map((c) => (
            <CommentRow key={c.id} comment={c} canReport={!!myCreativeId} />
          ))}
          {myCreativeId ? (
            <CommentForm postId={post.id} />
          ) : (
            <p className="text-xs text-brand-brown/40">Only linked members can comment.</p>
          )}
        </div>
      )}
    </div>
  );
}

function CommentRow({ comment, canReport }: { comment: CommentT; canReport: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [reported, setReported] = useState(false);

  return (
    <div className="flex items-start justify-between gap-2 text-sm">
      <div>
        <span className="text-brand-brown/50 text-xs">
          {comment.creative.firstName} {comment.creative.lastName}
          {comment.creative.roles.length > 0 && ` · ${comment.creative.roles[0]}`}
        </span>
        <p className="text-brand-brown/80">{comment.body}</p>
      </div>
      {canReport && !reported && (
        <button
          disabled={isPending}
          onClick={() => startTransition(async () => { await reportComment(comment.id); setReported(true); })}
          className="text-[11px] text-brand-brown/30 hover:text-red-500 transition-colors shrink-0"
        >
          Report
        </button>
      )}
      {reported && <span className="text-[11px] text-brand-brown/30 shrink-0">Reported</span>}
    </div>
  );
}

function CommentForm({ postId }: { postId: string }) {
  const action = addComment.bind(null, postId);
  const [state, formAction, pending] = useActionState<CommentResult | null, FormData>(action, null);
  const [body, setBody] = useState("");

  // See NewPostForm.tsx for why this is adjusted during render rather than in a useEffect.
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state && "success" in state) setBody("");
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      {state && "error" in state && <p className="text-xs text-red-600">{state.error}</p>}
      <textarea
        name="body"
        required
        rows={2}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add a comment…"
        className="w-full bg-brand-green/5 border border-brand-green/15 rounded-lg px-3 py-2 text-sm text-brand-brown focus:outline-none focus:border-brand-green resize-none"
      />
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-brand-brown/40">
          {body.trim().split(/\s+/).filter(Boolean).length} / {COMMENT_MAX_WORDS} words
        </span>
        <button
          type="submit"
          disabled={pending}
          className="text-xs bg-brand-green hover:bg-brand-green/90 disabled:opacity-50 text-brand-cream font-semibold px-4 py-1.5 rounded-full transition-colors"
        >
          {pending ? "Posting…" : "Comment"}
        </button>
      </div>
    </form>
  );
}
