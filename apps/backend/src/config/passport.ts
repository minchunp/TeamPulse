import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { User } from "../models/User";
import { env } from "./env";

/**
 * Configures Passport strategies (Local, Google OAuth2, GitHub OAuth) for the application.
 */
export const configurePassport = (): void => {
   // 1. Local Strategy: email & password based authentication
   passport.use(
      new LocalStrategy(
         {
            usernameField: "email",
            passwordField: "password",
         },
         async (email, password, done) => {
            try {
               const normalizedEmail = email.toLowerCase().trim();
               const user = await User.findOne({ email: normalizedEmail });
               if (!user) {
                  return done(null, false, { message: "Incorrect email or password." });
               }

               // If the user registered via OAuth initially and has no password set
               if (!user.password) {
                  return done(null, false, {
                     message: "This account was registered using OAuth. Please sign in with Google or GitHub.",
                  });
               }

               const isMatch = await user.comparePassword(password);
               if (!isMatch) {
                  return done(null, false, { message: "Incorrect email or password." });
               }

               return done(null, user as any);
            } catch (error) {
               return done(error);
            }
         },
      ),
   );

   // 2. Google OAuth Strategy: auto-registers or links verified accounts
   passport.use(
      new GoogleStrategy(
         {
            clientID: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
            callbackURL: env.GOOGLE_CALLBACK_URL,
         },
         async (accessToken, refreshToken, profile, done) => {
            try {
               const emailObj = profile.emails?.find((e) => e.value);
               if (!emailObj) {
                  return done(null, false, { message: "Email address not provided by Google." });
               }

               // Security Check: Ensure the email is verified to prevent email-spoofing account takeover
               const isVerified = emailObj.verified === true;
               if (!isVerified) {
                  return done(null, false, { message: "Your Google email address is not verified." });
               }

               const email = emailObj.value.toLowerCase().trim();
               const googleId = profile.id;

               // Find by googleId first
               let user = await User.findOne({ googleId });
               if (user) {
                  return done(null, user as any);
               }

               // Account Linking: Find by email
               user = await User.findOne({ email });
               if (user) {
                  user.googleId = googleId;
                  if (!user.name && profile.displayName) {
                     user.name = profile.displayName;
                  }
                  await user.save();
                  return done(null, user as any);
               }

               // Auto-registration
               user = new User({
                  email,
                  googleId,
                  name: profile.displayName || profile.name?.givenName || "Google User",
               });
               await user.save();

               return done(null, user as any);
            } catch (error) {
               return done(error);
            }
         },
      ),
   );

   // 3. GitHub OAuth Strategy: auto-registers or links verified accounts
   passport.use(
      new GitHubStrategy(
         {
            clientID: env.GITHUB_CLIENT_ID,
            clientSecret: env.GITHUB_CLIENT_SECRET,
            callbackURL: env.GITHUB_CALLBACK_URL,
            scope: ["user:email"], // Ensure we request email scope from GitHub
         },
         async (accessToken: string, refreshToken: string, profile: any, done: any) => {
            try {
               const emailObj = profile.emails?.find((e: any) => e.value);
               if (!emailObj) {
                  return done(null, false, { message: "Email address not provided by GitHub." });
               }

               // Security Check: Ensure email is verified.
               // Note: GitHub profiles can contain a verified property. If undefined, we check if it is not explicitly false.
               const isVerified = emailObj.verified === true || emailObj.verified === "true" || emailObj.verified === undefined;
               if (!isVerified) {
                  return done(null, false, { message: "Your GitHub email address is not verified." });
               }

               const email = emailObj.value.toLowerCase().trim();
               const githubId = profile.id;

               // Find by githubId first
               let user = await User.findOne({ githubId });
               if (user) {
                  return done(null, user as any);
               }

               // Account Linking: Find by email
               user = await User.findOne({ email });
               if (user) {
                  user.githubId = githubId;
                  if (!user.name && (profile.displayName || profile.username)) {
                     user.name = profile.displayName || profile.username;
                  }
                  await user.save();
                  return done(null, user as any);
               }

               // Auto-registration
               user = new User({
                  email,
                  githubId,
                  name: profile.displayName || profile.username || "GitHub User",
               });
               await user.save();

               return done(null, user as any);
            } catch (error) {
               return done(error);
            }
         },
      ),
   );
};
