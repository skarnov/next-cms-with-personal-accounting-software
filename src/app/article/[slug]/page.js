// app/articles/[slug]/page.js
import { Suspense } from "react";
import Link from "next/link";
import RelatedArticlesSidebar from "../../components/RelatedArticlesSidebar";
import ArticleImage from "../../components/ArticleImage";
import Loading from "../../components/Loading";

async function fetchArticleDetails(slug) {
  const baseURL = process.env.NEXT_PUBLIC_LOCAL_URL || 'http://localhost:3000';
  const cleanBaseURL = baseURL.replace(/\/+$/, '');
  const apiUrl = `${cleanBaseURL}/api/articles/${slug}?includeRelated=true`;

  const res = await fetch(apiUrl, {
    cache: "no-store",
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch article. Status: ${res.status}`);
  }

  const response = await res.json();
  return response.data || {};
}

async function ArticleDetailsContent({ slug }) {
  const article = await fetchArticleDetails(slug);

  return (
    <section className="py-20 bg-gray-900">
      <div className="container mx-auto px-6 flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <h2 className="text-4xl font-bold text-white mb-6">{article.title}</h2>
          
          {article.image && (
            <ArticleImage
              src={`${process.env.NEXT_PUBLIC_BASE_URL || ''}/${article.image}`}
              alt={article.title}
              className="w-full h-64 object-cover rounded-lg mb-6"
            />
          )}
          
          <div 
            className="text-gray-300 text-lg mb-6" 
            dangerouslySetInnerHTML={{ __html: article.description }} 
          />
          
          <Link href="/" className="text-lime-500 hover:text-lime-400 font-semibold inline-block">
            ← Back to Articles
          </Link>
        </div>
        
        {article.relatedArticles?.length > 0 && (
          <RelatedArticlesSidebar relatedArticles={article.relatedArticles} />
        )}
      </div>
    </section>
  );
}

export default function ArticleDetails({ params }) {
  return (
    <Suspense fallback={<Loading />}>
      <ArticleDetailsContent slug={params.slug} />
    </Suspense>
  );
}