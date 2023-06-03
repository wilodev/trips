import { Db, Filter } from 'mongodb';
import BaseRepository from './BaseRepository';
import { StationCorrelation, StationMapping } from '../interfaces/SearchInterfaces';

class StationRepository extends BaseRepository<StationCorrelation> {
  constructor(db: Db) {
    super(db, 'supplier_station_correlation');
  }

  public async getStationCorrelations(stations: StationMapping[]): Promise<StationCorrelation[]> {
    try {
      // Se obtiene un array con todos los códigos de estación
      const stationCodes = stations.map(station => station.destinationCode);
      const filter: Filter<StationCorrelation> = {
        code: { $in: stationCodes },
        suppliers: {
          $elemMatch: { $regex: /^SERVIVUELO#/ },
        },
      };
      return this.findMany(filter);
    } catch (error) {
      console.error('Error getting station correlations:', error);
      throw new Error(`Error getting station correlations: ${error.message}`);
    }
  }
}

export default StationRepository;
