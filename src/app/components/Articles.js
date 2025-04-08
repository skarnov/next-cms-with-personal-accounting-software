import { Suspense } from "react";
import ArticlesList from "./ArticlesList";

async function fetchArticles(offset = 0, limit = 9) {
  // During build time, return empty data
  if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
    return { articles: [], total: 0 };
  }

  const baseURL = process.env.NEXT_PUBLIC_SITE_URL || 
                 (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

  const url = new URL('/api/articles', baseURL);
  url.searchParams.set('offset', offset);
  url.searchParams.set('limit', limit);

  try {
    const res = await fetch(url.toString(), {
      cache: process.env.NODE_ENV === 'development' ? 'no-store' : 'force-cache'
    });
    if (!res.ok) throw new Error(`Failed to fetch articles: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("Fetch error:", error);
    return { articles: [], total: 0 };
  }
}

export const revalidate = 3600;

export default async function Articles() {
  let articles = [];
  let total = 0;

  try {
    const { articles: fetchedArticles = [], total: fetchedTotal = 0 } = await fetchArticles();
    articles = fetchedArticles;
    total = fetchedTotal;
  } catch (error) {
    return (
      <section id="articles" className="bg-gray-800 py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-white mb-12 text-center">Articles</h2>
          <p className="text-red-500 text-center">Failed to load articles. Please try again later.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="articles" className="bg-gray-800 py-20">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-white mb-12 text-center">Articles</h2>
        <Suspense fallback={
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        }>
          <ArticlesList initialArticles={articles} totalArticles={total} />
        </Suspense>
      </div>
    </section>
  );
}