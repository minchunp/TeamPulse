import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { User } from '../models/User';

/**
 * Creates a new project with the authenticated user designated as the owner.
 */
export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized. User context is missing.' });
      return;
    }

    if (!name || name.trim() === '') {
      res.status(400).json({ message: 'Project name is required.' });
      return;
    }

    // Create and save project
    const project = new Project({
      name: name.trim(),
      description: description ? description.trim() : '',
      owner: userId,
      members: [],
    });
    await project.save();

    // Populate owner details for the return payload
    await project.populate('owner', 'name email');

    res.status(201).json({
      message: 'Project created successfully.',
      project,
    });
  } catch (error) {
    console.error('❌ [Create Project Controller Error]:', error);
    res.status(500).json({ message: 'Internal server error while creating project.' });
  }
};

/**
 * Retrieves all projects where the authenticated user is either the owner or a member.
 */
export const getProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized. User context is missing.' });
      return;
    }

    // Fetch all projects matching user ownership or user membership
    const projects = await Project.find({
      $or: [
        { owner: userId },
        { 'members.user': userId },
      ],
    })
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    res.status(200).json({
      message: 'Projects retrieved successfully.',
      projects,
    });
  } catch (error) {
    console.error('❌ [Get Projects Controller Error]:', error);
    res.status(500).json({ message: 'Internal server error while fetching projects.' });
  }
};

/**
 * Returns project details directly from req.project (pre-fetched and pre-populated by authorize middleware).
 */
export const getProjectById = async (req: Request, res: Response): Promise<void> => {
  try {
    // req.project is pre-populated with owner and members.user inside the authorize middleware
    if (!req.project) {
      res.status(404).json({ message: 'Project context is missing.' });
      return;
    }

    res.status(200).json({
      message: 'Project details retrieved successfully.',
      project: req.project,
    });
  } catch (error) {
    console.error('❌ [Get Project By ID Controller Error]:', error);
    res.status(500).json({ message: 'Internal server error while retrieving project details.' });
  }
};

/**
 * Invites a user by email to join a project with a specified role ('Manager' or 'Member').
 */
export const inviteMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, role } = req.body;
    const project = req.project;

    if (!project) {
      res.status(404).json({ message: 'Project context is missing.' });
      return;
    }

    if (!email || !role) {
      res.status(400).json({ message: 'Email and role are required.' });
      return;
    }

    // Restrict role to 'Manager' or 'Member'
    if (role !== 'Manager' && role !== 'Member') {
      res.status(400).json({ message: 'Invalid role. You can only invite a "Manager" or "Member".' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find the user to invite
    const foundUser = await User.findOne({ email: normalizedEmail });
    if (!foundUser) {
      res.status(404).json({ message: `User with email "${email}" not found.` });
      return;
    }

    const foundUserIdStr = foundUser._id.toString();

    // Validation 1: Check if the user is already the owner
    if (project.owner.toString() === foundUserIdStr) {
      res.status(400).json({ message: 'This user is already the owner of the project.' });
      return;
    }

    // Validation 2: Check if the user is already a member
    const isAlreadyMember = project.members.some(
      (m) => m.user.toString() === foundUserIdStr
    );
    if (isAlreadyMember) {
      res.status(400).json({ message: 'This user is already a member of the project.' });
      return;
    }

    // Add member and save
    project.members.push({
      user: foundUser._id,
      role,
    });
    await project.save();

    // Populate user metadata for the newly added member before returning
    await project.populate('members.user', 'name email');

    res.status(200).json({
      message: 'Member invited successfully.',
      project,
    });
  } catch (error) {
    console.error('❌ [Invite Member Controller Error]:', error);
    res.status(500).json({ message: 'Internal server error while inviting member.' });
  }
};
