import { Request, Response } from "express";
import { Task } from "../models/Task";

/**
 * Helper function to verify if a given assignee is authorized on a project.
 * Checks both project owner and project members.
 */
const isAssigneeAuthorized = (project: any, assigneeId: string): boolean => {
   const assigneeStr = assigneeId.toString();

   // 1. Check if assignee is the project owner
   const ownerId = project.owner._id ? project.owner._id.toString() : project.owner.toString();
   if (ownerId === assigneeStr) {
      return true;
   }

   // 2. Check if assignee is in the project members list
   return project.members.some((m: any) => {
      const memberId = m.user._id ? m.user._id.toString() : m.user.toString();
      return memberId === assigneeStr;
   });
};

/**
 * Creates a new task under the current project.
 * Restricts assignees to project owner or active members.
 */
export const createTask = async (req: Request, res: Response): Promise<void> => {
   try {
      const { title, description, assignee } = req.body;
      const project = req.project;

      if (!project) {
         res.status(404).json({ message: "Project context is missing." });
         return;
      }

      if (!title || title.trim() === "") {
         res.status(400).json({ message: "Task title is required." });
         return;
      }

      // Integrity Check: Validate assignee membership
      if (assignee) {
         if (!isAssigneeAuthorized(project, assignee)) {
            res.status(400).json({
               message: "Assignment failed. The assignee must be either the project owner or a project member.",
            });
            return;
         }
      }

      // Instantiate and save task
      const task = new Task({
         title: title.trim(),
         description: description ? description.trim() : "",
         status: "TODO",
         projectId: project._id,
         assignee: assignee || undefined,
      });
      await task.save();

      // Populate assignee details before returning
      if (task.assignee) {
         await task.populate("assignee", "name email");
      }

      res.status(201).json({
         message: "Task created successfully.",
         task,
      });
   } catch (error) {
      console.error("❌ [Create Task Controller Error]:", error);
      res.status(500).json({ message: "Internal server error while creating task." });
   }
};

/**
 * Retrieves all tasks associated with the current project.
 */
export const getProjectTasks = async (req: Request, res: Response): Promise<void> => {
   try {
      const project = req.project;

      if (!project) {
         res.status(404).json({ message: "Project context is missing." });
         return;
      }

      // Retrieve tasks and populate basic assignee info
      const tasks = await Task.find({ projectId: project._id }).populate("assignee", "name email");

      res.status(200).json({
         message: "Project tasks retrieved successfully.",
         tasks,
      });
   } catch (error) {
      console.error("❌ [Get Project Tasks Controller Error]:", error);
      res.status(500).json({ message: "Internal server error while fetching tasks." });
   }
};

/**
 * Updates status and/or assignee of a specific task within the current project.
 * Restricts assignees to project owner or active members.
 */
export const updateTask = async (req: Request, res: Response): Promise<void> => {
   try {
      const { taskId } = req.params;
      const { status, assignee } = req.body;
      const project = req.project;

      if (!project) {
         res.status(404).json({ message: "Project context is missing." });
         return;
      }

      if (!taskId) {
         res.status(400).json({ message: "Task ID parameter is required." });
         return;
      }

      // Build update object based on allowed fields
      const updatePayload: any = {};

      if (status !== undefined) {
         if (!["TODO", "IN_PROGRESS", "DONE"].includes(status)) {
            res.status(400).json({ message: "Invalid status value. Allowed: TODO, IN_PROGRESS, DONE." });
            return;
         }
         updatePayload.status = status;
      }

      if (assignee !== undefined) {
         if (assignee !== null && assignee !== "") {
            // Integrity Check: Validate assignee membership
            if (!isAssigneeAuthorized(project, assignee)) {
               res.status(400).json({
                  message: "Assignment failed. The assignee must be either the project owner or a project member.",
               });
               return;
            }
            updatePayload.assignee = assignee;
         } else {
            // Unassign user
            updatePayload.assignee = null;
         }
      }

      // Find and update the task inside the current project context for security
      const task = await Task.findOneAndUpdate({ _id: taskId, projectId: project._id }, { $set: updatePayload }, { new: true }).populate(
         "assignee",
         "name email",
      );

      if (!task) {
         res.status(404).json({ message: "Task not found in the current project." });
         return;
      }

      res.status(200).json({
         message: "Task updated successfully.",
         task,
      });
   } catch (error) {
      console.error("❌ [Update Task Controller Error]:", error);
      res.status(500).json({ message: "Internal server error while updating task." });
   }
};
