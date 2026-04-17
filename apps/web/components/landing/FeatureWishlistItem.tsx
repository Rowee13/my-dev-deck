'use client';

import type { FeatureIdea } from '../../lib/github';

interface Props {
  idea: FeatureIdea;
}

export function FeatureWishlistItem({ idea }: Props) {
  return (
    <a
      href={idea.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 hover:-translate-y-0.5 transition-all duration-200"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
        {idea.title}
      </h3>
      {idea.bodyExcerpt && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {idea.bodyExcerpt}
        </p>
      )}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
          </svg>
          {idea.upvotes}
        </span>
        <span className="flex items-center gap-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {idea.commentCount}
        </span>
      </div>
    </a>
  );
}
