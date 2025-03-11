"use client";

import Link from "next/link";

export default function RelatedArticlesSidebar({ relatedArticles }) {
  if (!relatedArticles || relatedArticles.length === 0) {
    return (
      <aside className="w-96 bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold text-white mb-4">Related Articles</h3>
        <div className="text-gray-300">No related articles found.</div>
      </aside>
    );
  }

  return (
    <aside className="w-96 bg-gray-800 p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-bold text-white mb-4">Related Articles</h3>
      <div className="space-y-4">
        {relatedArticles.map((article) => (
          <div key={article.id} className="bg-gray-700 rounded-lg shadow-lg border-l-4 border-lime-500 hover:border-lime-400 transition-colors hover:shadow-xl hover:scale-105 transform transition-transform">
            <div className="p-4">
              <div className="flex flex-wrap gap-2 mb-2">
                {article.tags.map((tag) => (
                  <span key={tag.id} className="bg-gray-600 text-white px-2 py-1 rounded-full text-xs">
                    {tag.name}
                  </span>
                ))}
              </div>
              <h4 className="text-lg font-bold text-white mb-2">{article.title}</h4>
              <p className="text-gray-300 text-sm mb-4">{article.summary}</p>
              <Link href={`/article/${article.slug}`} className="text-lime-500 hover:text-lime-400 font-semibold text-sm inline-block">
                View Article →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
