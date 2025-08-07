# **Next CMS with Personal Accounting**  
*[Next.js Content Management System + Financial Tracking Software]*

[![Next.js](https://img.shields.io/badge/Next.js-14-blue)](https://nextjs.org)
[![NextAuth](https://img.shields.io/badge/Auth-NextAuth.js-red)](https://next-auth.js.org)
[![MySQL](https://img.shields.io/badge/Database-MySQL-orange)](https://mysql.com)
[![TailwindCSS](https://img.shields.io/badge/Styling-TailwindCSS-06B6D4)](https://tailwindcss.com)

## **🌟 Key Features**

### **📝 CMS Module**
- Article management with rich text editing
- Tag/category system with relational database
- SEO-optimized pages with dynamic metadata

### **💰 Accounting Module**
- Double-entry transaction system (Income/Expense)
- Multi-currency support (GBP, USD, BDT)
- Wallet-based financial organization
- Monthly/yearly financial reports

### **🔒 Secure Authentication**
- JWT-based session management
- Protected routes middleware
- CSRF/XSS protection

## **🛠 Tech Stack**

| Component       | Technology               |
|-----------------|--------------------------|
| Framework       | Next.js 14 (App Router)  |
| Database        | MySQL                    |
| ORM             | Raw SQL Queries          |
| Authentication  | NextAuth.js              |
| Styling         | Tailwind CSS             |
| Security        | XSS sanitization         |

## **🗂 Project Structure**

```
src/
├── app/
│   ├── (auth)/           # Authentication routes
│   ├── account/          # Accounting dashboard
│   ├── cms/              # Content management
│   └── api/              # API endpoints
├── lib/
│   ├── database/         # MySQL connection
│   ├── models/           # Data models
│   └── security/         # Auth utilities
├── middleware.js         # Route protection
└── styles/               # Global CSS
```

## **🔐 Authentication Flow**

```javascript
// middleware.js
export async function middleware(request) {
  const session = await getToken({ req: request });
  const { pathname } = request.nextUrl;

  // Redirect authenticated users from auth pages
  if (session && pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/account', request.url));
  }

  // Protect accounting and CMS routes
  if (!session && (pathname.startsWith('/account') || pathname.startsWith('/cms'))) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
}
```

## **📊 Database Schema**

```sql
-- Content Management
CREATE TABLE articles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  status ENUM('draft','published') DEFAULT 'draft'
);

-- Financial Tracking
CREATE TABLE transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  amount DECIMAL(10,2) NOT NULL,
  type ENUM('income','expense') NOT NULL,
  currency CHAR(3) DEFAULT 'USD',
  wallet_id INT NOT NULL
);
```
