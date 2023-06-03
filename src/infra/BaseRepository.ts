import { Db, Collection, Filter, FindOptions, UpdateFilter, WithId } from 'mongodb';

class BaseRepository<T> {
  protected db: Db;
  public collectionName = '';

  constructor(db: Db, collectionName?: string) {
    this.db = db;
    if (collectionName) {
      this.collectionName = collectionName;
    }
  }

  protected get collection(): Collection<T> {
    if (this.collectionName) {
      return this.db.collection(this.collectionName);
    }

    throw new Error('Collection Name not specified');
  }

  public async findOne(filter: Filter<T>, options?: FindOptions<T>): Promise<WithId<T>> {
    const result = await this.collection.findOne(filter, options);
    if (!result) {
      throw new Error('Document not found');
    }
    return result;
  }

  public async findMany(filter: Filter<T>, options?: FindOptions<T>): Promise<any[]> {
    return this.collection.find(filter, options).toArray();
  }

  public async updateOne(filter: Filter<T>, update: UpdateFilter<T>): Promise<void> {
    try {
      await this.collection.updateOne(filter, update);
    } catch (error) {
      console.error('Error updating document:', error);
      throw new Error('Error updating document');
    }
  }

  public async updateMany(filter: Filter<T>, update: UpdateFilter<T>): Promise<void> {
    await this.collection.updateMany(filter, update);
  }
}

export default BaseRepository;
