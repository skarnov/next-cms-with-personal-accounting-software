"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import ViewMoreArticles from "./ViewMoreArticles";

function ArticleCard({ article }) {
  return (
    <div className="bg-gray-700 rounded-lg shadow-lg border-l-4 border-lime-500 hover:border-lime-400 transition-colors hover:shadow-xl hover:scale-105 transform transition-transform">
      <div className="p-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {article.tags &&
            article.tags.map((tag) => (
              <span key={tag.id} className="bg-gray-600 text-white px-3 py-1 rounded-full text-sm">
                {tag.name}
              </span>
            ))}
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">{article.article_title}</h3>
        <p className="text-gray-300 mb-4">{article.article_summary}</p>
        <Link href={`/article/${article.article_slug}`} className="text-lime-500 hover:text-lime-400 font-semibold inline-block">
          View Article →
        </Link>
      </div>
    </div>
  );
}

export default function ArticlesList({ initialArticles, totalArticles }) {
  const [articles, setArticles] = useState(initialArticles || []);
  const [visibleCount, setVisibleCount] = useState(9);
  const [loading, setLoading] = useState(false);
  const articlesSectionRef = useRef(null);

  const handleViewMore = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/articles?offset=${visibleCount}&limit=9`);
      if (!response.ok) throw new Error("Failed to fetch articles");
      const data = await response.json();

      setArticles((prevArticles) => [...prevArticles, ...data.articles]);
      setVisibleCount((prevCount) => prevCount + 9);
    } catch (error) {
      console.error("Error fetching more articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowLess = () => {
    setArticles(initialArticles || []);
    setVisibleCount(9);
  };

  // Use useEffect to handle scrolling after state updates
  useEffect(() => {
    if (articlesSectionRef.current && visibleCount === 9) {
      // Scroll to the articles section only if it's not already at the top
      const rect = articlesSectionRef.current.getBoundingClientRect();
      if (rect.top < 0 || rect.bottom > window.innerHeight) {
        articlesSectionRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [visibleCount]);

  const visibleArticles = Array.isArray(articles) ? articles.slice(0, visibleCount) : [];

  if (!articles || articles.length === 0) {
    return <p className="text-white text-center">No articles found.</p>;
  }

  return (
    <>
      <div ref={articlesSectionRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {visibleArticles.map((article) => (
          <ArticleCard key={article.article_id} article={article} />
        ))}
      </div>
      <div className="text-center text-white mt-4">
        Showing {visibleArticles.length} of {totalArticles} articles
      </div>
      {totalArticles > 9 && (
        <ViewMoreArticles
          showAll={visibleCount >= totalArticles}
          onClick={visibleCount >= totalArticles ? handleShowLess : handleViewMore}
          loading={loading}
        />
      )}
    </>
  );
}