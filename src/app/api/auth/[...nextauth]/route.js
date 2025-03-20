import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

const authOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const db = await mysql.createConnection({
            host: "localhost",
            user: "root",
            password: "",
            database: "db_me",
          });

          // Query the user by email
          const [users] = await db.execute("SELECT * FROM admins WHERE email = ? LIMIT 1", [credentials.email]);

          await db.end(); // Close the database connection

          if (users.length === 0) {
            throw new Error("Invalid credentials");
          }

          const user = users[0];

          // Validate password
          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) {
            throw new Error("Invalid credentials");
          }

          return {
            id: user.id,
            name: user.user_name, // Using first_name as name
            email: user.email,
          };
        } catch (error) {
          throw new Error("Authentication failed: " + error.message);
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
export { authOptions };
