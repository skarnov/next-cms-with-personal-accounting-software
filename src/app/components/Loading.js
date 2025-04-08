// src/components/Loading.js
export default function Loading() {
    return (
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="h-12 bg-gray-800 rounded-lg w-1/2 mb-6 animate-pulse"></div>
          <div className="w-full h-64 bg-gray-800 rounded-lg mb-6 animate-pulse"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-800 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-gray-800 rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-gray-800 rounded w-2/3 animate-pulse"></div>
          </div>
        </div>
      </section>
    );
  }