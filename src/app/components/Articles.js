import { Suspense } from "react";
import ArticlesList from "./ArticlesList";

async function fetchArticles(offset = 0, limit = 9) {
  try {
    const baseURL = process.env.NEXT_PUBLIC_PUBLIC_URL || process.env.NEXT_PUBLIC_LOCAL_URL;

    // Fetch articles with pagination
    const res = await fetch(`${baseURL}/api/articles?offset=${offset}&limit=${limit}`, {
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching articles:", error);
    throw error; // Re-throw the error to be caught by the Error Boundary
  }
}

async function ArticlesContent() {
  const { articles, totalArticles } = await fetchArticles(); // Fetch data on the server

  if (!articles || articles.length === 0) {
    return (
      <section id="articles" className="bg-gray-800 py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-white mb-12 text-center">Articles</h2>
          <p className="text-gray-300 text-center">No articles found.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="articles" className="bg-gray-800 py-20">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-white mb-12 text-center">Articles</h2>
        <ArticlesList initialArticles={articles} totalArticles={totalArticles} />
      </div>
    </section>
  );
}

function ErrorBoundary({ children }) {
  try {
    return children;
  } catch (error) {
    return (
      <section id="articles" className="bg-gray-800 py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-white mb-12 text-center">Articles</h2>
          <p className="text-red-500 text-center">Failed to load articles.</p>
        </div>
      </section>
    );
  }
}

export default function Articles() {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <section id="articles" className="bg-gray-800 py-20">
            <div className="container mx-auto px-6">
              <h2 className="text-4xl font-bold text-white mb-12 text-center">Articles</h2>
              <p className="text-gray-300 text-center">Loading...</p>
            </div>
          </section>
        }
      >
        <ArticlesContent />
      </Suspense>
    </ErrorBoundary>
  );
}