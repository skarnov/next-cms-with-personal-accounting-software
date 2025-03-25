import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";

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
        let connection;
        try {
          connection = await pool.getConnection();

          const [users] = await connection.query("SELECT * FROM admins WHERE email = ? LIMIT 1", [credentials.email]);

          if (users.length === 0) {
            throw new Error("Invalid credentials");
          }

          const user = users[0];

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) {
            throw new Error("Invalid credentials");
          }

          return {
            id: user.id.toString(),
            name: user.user_name,
            email: user.email,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          throw new Error("Authentication failed: " + error.message);
        } finally {
          if (connection) connection.release();
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
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
export { authOptions };