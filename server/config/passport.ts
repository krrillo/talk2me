import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { db } from '../lib/db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

export function configurePassport() {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: '/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const googleId = profile.id;
          
          if (!email || !googleId) {
            return done(new Error('No email or Google ID from profile'), undefined);
          }

          let user = await db.query.users.findFirst({
            where: eq(users.googleId, googleId),
          });

          if (!user) {
            const baseUsername = email.split('@')[0];
            let finalUsername = baseUsername;
            let suffix = 1;

            while (true) {
              const collision = await db.query.users.findFirst({
                where: eq(users.username, finalUsername)
              });

              if (!collision) break;

              suffix++;
              finalUsername = `${baseUsername}${suffix}`;
            }

            const [newUser] = await db
              .insert(users)
              .values({
                username: finalUsername,
                email,
                googleId,
                displayName: profile.displayName || email,
                photoUrl: profile.photos?.[0]?.value,
                emailVerified: true,
                role: 'parent',
              })
              .returning();
            
            user = newUser;
          }

          return done(null, user);
        } catch (error) {
          console.error('Google OAuth error:', error);
          return done(error as Error, undefined);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, id),
      });
      
      done(null, user || null);
    } catch (error) {
      done(error, null);
    }
  });
}
