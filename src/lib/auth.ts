import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { SiweMessage } from 'siwe';
import { getCsrfToken } from 'next-auth/react';

// Extend the built-in session type
declare module 'next-auth' {
  interface Session {
    address?: string;
    user: {
      name: string;
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'siwe',
      name: 'SIWE',
      credentials: {
        message: { label: 'Message', type: 'text' },
        signature: { label: 'Signature', type: 'text' },
      },
      async authorize(credentials: Record<'message' | 'signature', string> | undefined) {
        try {
          if (!credentials?.message || !credentials?.signature || !getCsrfToken) {
            return null;
          }

          const siwe = new SiweMessage(JSON.parse(credentials.message));
          const result = await siwe.verify({
            signature: credentials.signature,
          });

          if (result.success) {
            return {
              id: siwe.address,
            };
          }
          return null;
        } catch (e) {
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async session({ session, token }: { session: any; token: any }) {
      session.address = token.sub;
      session.user = {
        name: token.sub,
      };
      return session;
    },
  },
}; 