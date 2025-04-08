import { Suspense } from "react";
import ArticlesList from "./ArticlesList";

async function fetchArticles(offset = 0, limit = 9) {
  const baseURL = process.env.NEXT_PUBLIC_LOCAL_URL || "";
  const res = await fetch(`${baseURL}/api/articles?offset=${offset}&limit=${limit}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch articles: ${res.status}`);
  }

  return await res.json();
}

export const revalidate = 3600;

export default async function Articles() {
  let articles, totalArticles;

  try {
    const data = await fetchArticles();
    articles = data.articles;
    totalArticles = data.totalArticles;
  } catch (error) {
    console.error("Article fetch error:", error);
    return (
      <section id="articles" className="bg-gray-800 py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-white mb-12 text-center">Articles</h2>
          <p className="text-red-500 text-center">Failed to load articles. Please try again later.</p>
        </div>
      </section>
    );
  }

  if (!articles || articles.length === 0) {
    return (
      <section id="articles" className="bg-gray-800 py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-white mb-12 text-center">Articles</h2>
          <p className="text-gray-300 text-center">No articles available at this time.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="articles" className="bg-gray-800 py-20">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-white mb-12 text-center">Articles</h2>
        <Suspense fallback={<p className="text-gray-300 text-center">Loading articles...</p>}>
          <ArticlesList initialArticles={articles} totalArticles={totalArticles} />
        </Suspense>
      </div>
    </section>
  );
}