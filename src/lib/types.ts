import { z } from "zod";

// Task schema for schedule items
export const TaskSchema = z.object({
  id: z.string(),
  time: z.string(), // Format: "HH:mm"
  title: z.string(),
  description: z.string().optional(),
  duration: z.number().optional(), // in minutes
  priority: z.enum(["high", "medium", "low"]).optional(),
  status: z.enum(["pending", "in-progress", "completed", "cancelled"]).optional(),
  category: z.enum(["work", "family", "personal", "health", "errand"]).optional(),
});

export type Task = z.infer<typeof TaskSchema>;

// Schedule response from AI
export const ScheduleUpdateSchema = z.object({
  tasks: z.array(TaskSchema),
  message: z.string(), // Supportive message from AI commander
  affectedTasks: z.array(z.string()).optional(), // IDs of tasks that were modified
  reasoning: z.string().optional(), // AI's reasoning for the changes
});

export type ScheduleUpdate = z.infer<typeof ScheduleUpdateSchema>;

// User context stored in database
export interface UserContext {
  id: string;
  user_id: string;
  family_structure: FamilyStructure;
  resources: Resources;
  routines: Routine[];
  preferences: UserPreferences;
  created_at: string;
  updated_at: string;
}

export interface FamilyStructure {
  members: FamilyMember[];
  pets?: Pet[];
}

export interface FamilyMember {
  name: string;
  relationship: string; // "self", "spouse", "son", "daughter", etc.
  age?: number;
  school?: string;
  workplace?: string;
  notes?: string;
}

export interface Pet {
  name: string;
  type: string;
  notes?: string;
}

export interface Resources {
  vehicles?: string[];
  nearby_facilities?: string[];
  support_network?: string[]; // Grandparents, babysitter, etc.
}

export interface Routine {
  name: string;
  time: string;
  days: string[]; // ["monday", "tuesday", etc.]
  description?: string;
}

export interface UserPreferences {
  timezone: string;
  language: string;
  notification_style: "minimal" | "detailed";
}

// Database table types
export interface DatabaseTask {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  time: string;
  title: string;
  description: string | null;
  duration: number | null;
  priority: "high" | "medium" | "low" | null;
  status: "pending" | "in-progress" | "completed" | "cancelled";
  category: "work" | "family" | "personal" | "health" | "errand" | null;
  created_at: string;
  updated_at: string;
}

// Chat message types
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  scheduleUpdate?: ScheduleUpdate;
}
