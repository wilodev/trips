import { Db } from 'mongodb';
import BaseRepository from './BaseRepository';
import { CTSearch } from '@/types';

class ResultsRepository extends BaseRepository<CTSearch> {
  constructor(db: Db) {
    super(db, 'train_results');
  }

  public async saveSearchResults(searchResults: CTSearch[]): Promise<void> {
    try {
      await this.collection.insertMany(searchResults);
      console.log('Search results saved successfully.');
    } catch (error) {
      console.error('Error saving search results:', error);
      throw new Error(`Error saving search results: ${error.message}`);
    }
  }
}

export default ResultsRepository;
