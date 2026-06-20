import { Request, Response, NextFunction } from "express";
import { Project, IProject } from "../models/Project";

// Module augmentation to extend the global Express Request interface
declare global {
   namespace Express {
      interface Request {
         project?: IProject;
      }
   }
}

/**
 * Middleware to authorize users based on project-level roles.
 *
 * @param allowedRoles Array of roles permitted to access the resource ('Admin' | 'Manager' | 'Member')
 */
export const authorize = (allowedRoles: string[]) => {
   return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
         const { projectId } = req.params;
         const userId = req.user?.id;

         if (!userId) {
            res.status(401).json({ message: "Unauthorized. User authentication context is missing." });
            return;
         }

         if (!projectId) {
            res.status(400).json({ message: "Bad Request. Project ID parameter is required." });
            return;
         }

         // Query database for the target project and populate user details for owner and members
         const project = await Project.findById(projectId).populate("owner", "name email").populate("members.user", "name email");
         if (!project) {
            res.status(404).json({ message: "Project not found." });
            return;
         }

         // Bypass check: If the user is the project owner, grant instant access
         if (project.owner.toString() === userId) {
            req.project = project;
            next();
            return;
         }

         // Check if user is in the members list and has one of the allowed roles
         const member = project.members.find((m) => m.user.toString() === userId);
         if (!member || !allowedRoles.includes(member.role)) {
            res.status(403).json({
               message: "Forbidden. You do not have the required role to access this project.",
            });
            return;
         }

         // Attach the project to the request object for use in downstream controllers
         req.project = project;
         next();
      } catch (error) {
         console.error("❌ [RBAC Middleware Error]:", error);
         res.status(500).json({ message: "Internal server error during authorization check." });
      }
   };
};
