import "./globals.css";

import AuthProvider from "../app/components/AuthProvider";

export const metadata = {
  title: "Shaik Obydullah - Full Stack Software Engineer & System Analyst",
  description: "Shaik Obydullah is a Full Stack Software Engineer and System Analyst specializing in Laravel, Next.js, MySQL, and cloud computing. Explore my portfolio to see my projects, skills, and experience in building scalable, business-driven solutions.",
  keywords: ["Shaik Obydullah", "Full Stack Software Engineer", "System Analyst", "Laravel", "Next.js", "MySQL", "Cloud Computing", "Web Development", "Portfolio", "Software Engineer Portfolio"],
  authors: [{ name: "Shaik Obydullah" }],
  openGraph: {
    title: "Shaik Obydullah - Full Stack Software Engineer & System Analyst",
    description: "Shaik Obydullah is a Full Stack Software Engineer and System Analyst specializing in Laravel, Next.js, MySQL, and cloud computing. Explore my portfolio to see my projects, skills, and experience in building scalable, business-driven solutions.",
    url: "https://yourportfolio.com",
    siteName: "Shaik Obydullah's Portfolio",
    images: [
      {
        url: "https://yourportfolio.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Shaik Obydullah - Full Stack Software Engineer & System Analyst",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shaik Obydullah - Full Stack Software Engineer & System Analyst",
    description: "Shaik Obydullah is a Full Stack Software Engineer and System Analyst specializing in Laravel, Next.js, MySQL, and cloud computing. Explore my portfolio to see my projects, skills, and experience in building scalable, business-driven solutions.",
    images: ["https://yourportfolio.com/twitter-image.jpg"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-gray-100 font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}