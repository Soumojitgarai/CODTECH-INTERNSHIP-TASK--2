import { 
  users, type User, type InsertUser,
  channels, type Channel, type InsertChannel,
  messages, type Message, type InsertMessage,
  type MessageWithUser
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserOnlineStatus(id: number, isOnline: boolean): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Channel operations
  getChannel(id: number): Promise<Channel | undefined>;
  getChannelByName(name: string): Promise<Channel | undefined>;
  createChannel(channel: InsertChannel): Promise<Channel>;
  getAllChannels(): Promise<Channel[]>;
  
  // Message operations
  getMessage(id: number): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByChannel(channelId: number, limit?: number): Promise<MessageWithUser[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private channels: Map<number, Channel>;
  private messages: Map<number, Message>;
  private userIdCounter: number;
  private channelIdCounter: number;
  private messageIdCounter: number;

  constructor() {
    this.users = new Map();
    this.channels = new Map();
    this.messages = new Map();
    this.userIdCounter = 1;
    this.channelIdCounter = 1;
    this.messageIdCounter = 1;
    
    // Initialize with default general channel
    this.createChannel({
      name: "general",
      description: "General discussions for the team",
      isDirectMessage: false
    });
    
    // Create random channel
    this.createChannel({
      name: "random",
      description: "Random topics and conversations",
      isDirectMessage: false
    });
    
    // Create support channel
    this.createChannel({
      name: "support",
      description: "Get help and support here",
      isDirectMessage: false
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    // Add a default password if none provided
    const userWithPassword = {
      ...insertUser,
      password: insertUser.password || 'default-password',
      initials: insertUser.initials || null,
      color: insertUser.color || null
    };
    const user: User = { ...userWithPassword, id, onlineStatus: true };
    this.users.set(id, user);
    return user;
  }
  
  async updateUserOnlineStatus(id: number, isOnline: boolean): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (user) {
      const updatedUser = { ...user, onlineStatus: isOnline };
      this.users.set(id, updatedUser);
      return updatedUser;
    }
    return undefined;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Channel operations
  async getChannel(id: number): Promise<Channel | undefined> {
    return this.channels.get(id);
  }
  
  async getChannelByName(name: string): Promise<Channel | undefined> {
    return Array.from(this.channels.values()).find(
      (channel) => channel.name === name,
    );
  }
  
  async createChannel(insertChannel: InsertChannel): Promise<Channel> {
    const id = this.channelIdCounter++;
    // Ensure required fields are properly set
    const channelData = {
      ...insertChannel,
      description: insertChannel.description || null,
      isDirectMessage: insertChannel.isDirectMessage || false
    };
    const channel: Channel = { ...channelData, id };
    this.channels.set(id, channel);
    return channel;
  }
  
  async getAllChannels(): Promise<Channel[]> {
    return Array.from(this.channels.values());
  }
  
  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }
  
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const timestamp = new Date();
    const message: Message = { ...insertMessage, id, timestamp };
    this.messages.set(id, message);
    return message;
  }
  
  async getMessagesByChannel(channelId: number, limit: number = 50): Promise<MessageWithUser[]> {
    const channelMessages = Array.from(this.messages.values())
      .filter(message => message.channelId === channelId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .slice(-limit);
    
    const messagesWithUsers: MessageWithUser[] = [];
    
    for (const message of channelMessages) {
      const user = await this.getUser(message.userId);
      if (user) {
        messagesWithUsers.push({
          ...message,
          user
        });
      }
    }
    
    return messagesWithUsers;
  }
}

export const storage = new MemStorage();
