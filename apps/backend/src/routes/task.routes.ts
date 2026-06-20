import { Router } from "express";
import { createTask, getProjectTasks, updateTask } from "../controllers/task.controller";
import { requireAuth } from "../middlewares/auth";
import { authorize } from "../middlewares/rbac";

// mergeParams: true is critical to inherit projectId from the parent project router
const router = Router({ mergeParams: true });

/**
 * @route   POST /api/projects/:projectId/tasks
 * @desc    Create a new task under a project (requires Admin or Manager roles)
 * @access  Private (Admin, Manager)
 */
router.post("/", requireAuth, authorize(["Admin", "Manager"]), createTask);

/**
 * @route   GET /api/projects/:projectId/tasks
 * @desc    Get all tasks belonging to a specific project
 * @access  Private (Admin, Manager, Member)
 */
router.get("/", requireAuth, authorize(["Admin", "Manager", "Member"]), getProjectTasks);

/**
 * @route   PATCH /api/projects/:projectId/tasks/:taskId
 * @desc    Update a specific task status and assignee
 * @access  Private (Admin, Manager, Member)
 */
router.patch("/:taskId", requireAuth, authorize(["Admin", "Manager", "Member"]), updateTask);

export const taskRouter = router;
