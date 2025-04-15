import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"),  // Removed .notNull()
  initials: text("initials"),
  color: text("color"),
  onlineStatus: boolean("online_status").default(false),
});

export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
    initials: true,
    color: true,
  })
  .partial({
    password: true,
  });

export const channels = pgTable("channels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  isDirectMessage: boolean("is_direct_message").default(false),
});

export const insertChannelSchema = createInsertSchema(channels).pick({
  name: true,
  description: true,
  isDirectMessage: true,
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  channelId: integer("channel_id").notNull().references(() => channels.id),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  content: true,
  userId: true,
  channelId: true,
});

// WebSocket message types
export const messageTypeSchema = z.enum([
  "CONNECT", // Initial connection
  "USER_JOINED", // New user joined
  "USER_LEFT", // User left
  "CHAT_MESSAGE", // Regular chat message
  "CHANNEL_JOINED", // User joined a channel
  "CHANNEL_LEFT", // User left a channel
  "TYPING", // User is typing
  "ERROR", // Error message
  "CONNECTION_STATUS", // Connection status update
]);

export const chatMessageSchema = z.object({
  type: messageTypeSchema,
  payload: z.object({
    message: z.string().optional(),
    channelId: z.number().optional(),
    userId: z.number().optional(),
    username: z.string().optional(),
    timestamp: z.string().optional(),
  }),
});

// Types
export type MessageType = z.infer<typeof messageTypeSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertChannel = z.infer<typeof insertChannelSchema>;
export type Channel = typeof channels.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Extended types for frontend
export type ChannelWithUnread = Channel & {
  unreadCount: number;
};

export type MessageWithUser = Message & {
  user: User;
};
