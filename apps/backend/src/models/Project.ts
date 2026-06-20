import mongoose, { Schema, Document, Types, Model } from "mongoose";

export type ProjectRole = "Admin" | "Manager" | "Member";

export interface IMember {
   user: Types.ObjectId;
   role: ProjectRole;
}

export interface IProject extends Document {
   name: string;
   description?: string;
   owner: Types.ObjectId;
   members: IMember[];
   createdAt: Date;
   updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
   {
      name: {
         type: String,
         required: true,
         trim: true,
      },
      description: {
         type: String,
         default: "",
      },
      owner: {
         type: Schema.Types.ObjectId,
         ref: "User",
         required: true,
      },
      members: [
         {
            user: {
               type: Schema.Types.ObjectId,
               ref: "User",
               required: true,
            },
            role: {
               type: String,
               enum: ["Admin", "Manager", "Member"],
               required: true,
            },
            _id: false, // Prevent MongoDB from auto-generating _id for subdocuments
         },
      ],
   },
   {
      timestamps: true,
   },
);

export const Project: Model<IProject> = mongoose.model<IProject>("Project", ProjectSchema);
