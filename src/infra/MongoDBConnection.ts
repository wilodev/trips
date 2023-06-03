import { MongoClient, Db } from 'mongodb';
import * as dotenv from 'dotenv';
dotenv.config();
class MongoDBConnection {
  private static instance: MongoDBConnection;
  private client: MongoClient;
  private db: Db;
  private mongoUrl: string;

  private constructor(mongoUrl: string) {
    this.mongoUrl = mongoUrl;
  }

  public static getInstance(): MongoDBConnection {
    if (!MongoDBConnection.instance) {
      const mongoUrl =
        `${process.env.MONGODB_SERVER}://${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}` ||
        `mongodb://localhost:27017`;
      MongoDBConnection.instance = new MongoDBConnection(mongoUrl);
    }
    return MongoDBConnection.instance;
  }

  public async connect(): Promise<void> {
    try {
      this.client = await MongoClient.connect(this.mongoUrl);
      this.db = this.client.db(process.env.MONGODB_DATABASE || 'trainEngine');
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw new Error('Failed to connect to MongoDB');
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.client.close();
    } catch (error) {
      throw new Error('Failed to disconnect from MongoDB');
    }
  }

  public getDb(): Db {
    if (!this.db) {
      throw new Error('MongoDB connection not established');
    }
    return this.db;
  }
}

export default MongoDBConnection.getInstance();
