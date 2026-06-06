import { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import prisma from '@/lib/db';

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'mock-google-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock-google-client-secret',
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;

      try {
        // Upsert user in our database
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!existingUser) {
          // Auto-create customer user
          const mockPhone = `+91${Math.floor(6000000000 + Math.random() * 4000000000)}`;
          await prisma.user.create({
            data: {
              email: user.email,
              phoneNumber: mockPhone,
              role: 'CUSTOMER',
              isEmailVerified: true, // Google email is verified
              profile: {
                create: {
                  fullName: user.name || 'Google User',
                  dob: new Date('1995-01-01'),
                  panNumber: `MOCKG${Math.floor(1000 + Math.random() * 9000)}G`,
                  aadhaarNumber: `9999${Math.floor(10000000 + Math.random() * 90000000)}`,
                  monthlyIncome: 0,
                  employmentType: 'SALARIED',
                  employmentDuration: 0,
                  addressLine1: 'Placeholder Address',
                  pincode: '000000',
                  city: 'Placeholder City',
                  state: 'Placeholder State',
                  bankAccountNo: '0000000000',
                  bankIfsc: 'ICIC0000000',
                  bankName: 'Placeholder Bank',
                },
              },
            },
          });
          console.log(`[NextAuth] Auto-registered Google user: ${user.email}`);
        } else {
          // If user exists, mark email verified as true since they logged in via Google
          if (!existingUser.isEmailVerified) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { isEmailVerified: true },
            });
            console.log(`[NextAuth] Marked user ${user.email} as verified via Google`);
          }
        }
        return true;
      } catch (error) {
        console.error('Error in NextAuth signIn callback:', error);
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
};
