import { Router } from "express";
import { createProject, getProjects, getProjectById, inviteMember } from "../controllers/project.controller";
import { requireAuth } from "../middlewares/auth";
import { authorize } from "../middlewares/rbac";

const router = Router();

/**
 * @route   POST /api/projects
 * @desc    Create a new project
 * @access  Private
 */
router.post("/", requireAuth, createProject);

/**
 * @route   GET /api/projects
 * @desc    Get all projects for the authenticated user
 * @access  Private
 */
router.get("/", requireAuth, getProjects);

/**
 * @route   GET /api/projects/:projectId
 * @desc    Get details of a specific project (requires membership)
 * @access  Private (Admin, Manager, Member)
 */
router.get("/:projectId", requireAuth, authorize(["Admin", "Manager", "Member"]), getProjectById);

/**
 * @route   POST /api/projects/:projectId/invite
 * @desc    Invite a user to a project (requires Admin or Manager roles)
 * @access  Private (Admin, Manager)
 */
router.post("/:projectId/invite", requireAuth, authorize(["Admin", "Manager"]), inviteMember);

export const projectRouter = router;
