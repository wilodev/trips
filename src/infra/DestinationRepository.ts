import { Db } from 'mongodb';
import BaseRepository from './BaseRepository';
import { StationMapping } from '../interfaces/SearchInterfaces';

class DestinationRepository extends BaseRepository<StationMapping> {
  constructor(db: Db) {
    super(db, 'journey_destination_tree');
  }
  /**
   *
   * @param cityOrStation  Ciudad, País o Estación
   * @param origin Bandera para indicar si se busca por origen o destino por defecto en true es para la relación destination (origen)
   * @returns
   */
  public async getStationMappings(cityOrStation: string, origin = true): Promise<StationMapping[]> {
    // Transformar la ciudad o estación a mayúsculas
    cityOrStation = cityOrStation.toUpperCase();
    // Variable para almacenar la expresión de busqueda de origen o destino
    let stationOrigin = {};
    try {
      // Buscar por estación origen
      if (origin) stationOrigin = { destinationCode: cityOrStation };
      // Buscar por estación destino
      else stationOrigin = { arrivalCode: cityOrStation };
      // Variable para almacenar el array de las estaciones encontradas
      const stationMappings: StationMapping[] = [];
      // Buscar por código de estación
      const stationMappingByStation = (await this.collection
        .find(stationOrigin)
        .toArray()) as StationMapping[];
      // Si se encontró una estación, se almacena sus datos en el array de estaciones
      if (stationMappingByStation.length > 0) {
        stationMappingByStation.forEach((stationMapping: StationMapping) => {
          stationMapping.destinationTree = stationMapping.destinationTree.filter(
            (tree: string) => tree !== cityOrStation,
          );
          stationMapping.arrivalTree = stationMapping.arrivalTree.filter(
            (tree: string) => tree !== cityOrStation,
          );

          stationMappings.push({
            destinationCode: stationMapping.destinationCode,
            arrivalCode: stationMapping.arrivalCode,
            destinationTree: stationMapping.destinationTree,
            arrivalTree: stationMapping.arrivalTree,
          } as StationMapping);
        });
      } else {
        // Caso contrario no es una estación y puede ser una ciudad, país, etc...
        if (origin) {
          stationOrigin = { destinationTree: { $elemMatch: { $eq: cityOrStation } } };
        } else {
          stationOrigin = { arrivalTree: { $elemMatch: { $eq: cityOrStation } } };
        }
        const queryMappings = {
          ...stationOrigin,
        };

        // Si no se encontró una estación, buscar por ciudad
        const stationMappingsByCity = (await this.collection
          .find(queryMappings)
          .toArray()) as StationMapping[];
        if (stationMappingsByCity.length === 0) {
          throw new Error(
            `No station mappings found for city, country or station ${cityOrStation}`,
          );
        }
        stationMappingsByCity.forEach((stationMapping: StationMapping) => {
          stationMapping.destinationTree = stationMapping.destinationTree.filter(
            (tree: string) => tree !== cityOrStation,
          );
          stationMapping.arrivalTree = stationMapping.arrivalTree.filter(
            (tree: string) => tree !== cityOrStation,
          );

          stationMappings.push({
            destinationCode: stationMapping.destinationCode,
            arrivalCode: stationMapping.arrivalCode,
            destinationTree: stationMapping.destinationTree,
            arrivalTree: stationMapping.arrivalTree,
          } as StationMapping);
        });
      }

      return stationMappings;
    } catch (error) {
      console.error('Error getting station mappings:', error);
      throw new Error(`Error getting station mappings: ${error.message}`);
    }
  }
}

export default DestinationRepository;
