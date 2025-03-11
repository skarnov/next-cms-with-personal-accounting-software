export default function ViewMoreArticles({ showAll, onClick, loading, loadingText = "Loading...", bgColor = "lime-500", hoverColor = "lime-600" }) {
  return (
    <div className="flex justify-center mt-8">
      <button
        onClick={onClick}
        className={`bg-${bgColor} text-white px-6 py-2 rounded-full hover:bg-${hoverColor} transition-colors`}
        disabled={loading} // Disable button while loading
        aria-label={showAll ? "Show Less" : "View More"}
      >
        {loading ? (
          <div className="flex items-center">
            <span>{loadingText}</span>
            {/* Optional: Add a loading spinner */}
            <svg className="animate-spin ml-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : showAll ? (
          "Show Less Articles"
        ) : (
          "View More Articles"
        )}
      </button>
    </div>
  );
}