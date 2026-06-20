import mongoose, { Schema, Document, Types, Model } from "mongoose";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export interface ITask extends Document {
   title: string;
   description?: string;
   status: TaskStatus;
   projectId: Types.ObjectId;
   assignee?: Types.ObjectId;
   createdAt: Date;
   updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
   {
      title: {
         type: String,
         required: true,
         trim: true,
      },
      description: {
         type: String,
         default: "",
      },
      status: {
         type: String,
         enum: ["TODO", "IN_PROGRESS", "DONE"],
         default: "TODO",
      },
      projectId: {
         type: Schema.Types.ObjectId,
         ref: "Project",
         required: true,
      },
      assignee: {
         type: Schema.Types.ObjectId,
         ref: "User",
      },
   },
   {
      timestamps: true,
   },
);

export const Task: Model<ITask> = mongoose.model<ITask>("Task", TaskSchema);
