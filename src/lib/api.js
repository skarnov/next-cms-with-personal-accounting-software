const getBaseUrl = () => {
    if (typeof window !== 'undefined') return window.location.origin // browser
    if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL // SSR
    return 'http://localhost:3000' // fallback for local dev
  }
  
  export async function fetchArticles({ offset = 0, limit = 9 } = {}) {
    const baseUrl = getBaseUrl()
    const url = new URL('/api/articles', baseUrl)
    url.searchParams.set('offset', offset)
    url.searchParams.set('limit', limit)
  
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch articles:', error)
      return { articles: [], total: 0 }
    }
  }