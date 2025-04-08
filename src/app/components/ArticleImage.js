// components/ArticleImage.js
'use client';

export default function ArticleImage({ src, alt, className }) {
  return (
    <img 
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        console.error('Image failed to load:', src);
        e.target.style.display = 'none';
      }}
    />
  );
}