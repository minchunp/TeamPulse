import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
   email?: string;
   password?: string;
   name: string;
   googleId?: string;
   githubId?: string;
   comparePassword(candidatePassword: string): Promise<boolean>;
   createdAt: Date;
   updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
   {
      email: {
         type: String,
         unique: true,
         sparse: true,
         lowercase: true,
         trim: true,
      },
      password: {
         type: String,
      },
      name: {
         type: String,
         required: true,
         trim: true,
      },
      googleId: {
         type: String,
         unique: true,
         sparse: true,
      },
      githubId: {
         type: String,
         unique: true,
         sparse: true,
      },
   },
   {
      timestamps: true,
   },
);

// Pre-save hook to hash password automatically
UserSchema.pre<IUser>("save", async function (next) {
   const user = this;

   // Only hash the password if it has been modified (or is new) and exists
   if (!user.isModified("password") || !user.password) {
      return next();
   }

   try {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
      next();
   } catch (err: any) {
      next(err);
   }
});

// Instance method to compare password during login
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
   if (!this.password) {
      return false;
   }
   return bcrypt.compare(candidatePassword, this.password);
};

export const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);
