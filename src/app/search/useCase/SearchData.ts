import { Db } from 'mongodb';
import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();
import {
  Passenger,
  Journey,
  StationCorrelation,
  TrainResult,
  TripType,
} from '../../../interfaces/SearchInterfaces';
import DestinationRepository from '../../../infra/DestinationRepository';
import StationRepository from '../../../infra/StationRepository';
import ResultsRepository from '../../../infra/ResultsRepository';
import { CTSearch } from '@/types';

class SearchData {
  private destinationRepository: DestinationRepository;
  private stationRepository: StationRepository;
  private resultsRepository: ResultsRepository;
  constructor(db: Db) {
    this.destinationRepository = new DestinationRepository(db);
    this.stationRepository = new StationRepository(db);
    this.resultsRepository = new ResultsRepository(db);
  }
  public async performSearch(
    journeys: Journey[],
    passenger: Passenger,
    bonus: ['retired'],
  ): Promise<void> {
    const tripType: TripType = this.getTripType(journeys);
    const searchResults: CTSearch[] = []; // Se crea el objeto de respuesta para guardar en la base de datos
    journeys.map(async journey => {
      const { from, to, date } = journey;
      // Llamar al repositorio para obtener los mapeos de estaciones
      const fromStationMappings = await this.destinationRepository.getStationMappings(from);
      const toStationMappings = await this.destinationRepository.getStationMappings(to, false);
      // Llamar al repositorio para obtener las correlaciones de estaciones
      const fromStationCorrelations = await this.stationRepository.getStationCorrelations(
        fromStationMappings,
      );
      const toStationCorrelations = await this.stationRepository.getStationCorrelations(
        toStationMappings,
      );
      // Llamar a otros servicios o repositorios necesarios para obtener los trenes disponibles, horarios, acomodaciones, etc.
      const trainsData = await this.getTrainsData(
        fromStationCorrelations,
        toStationCorrelations,
        date,
        passenger,
        bonus,
      );
      // Se crea el objeto de respuesta para guardar en la base de datos
      if (trainsData) {
        searchResults.push(
          ...this.generateSearchResults(trainsData, journeys, passenger, bonus, tripType),
        );
      }
    });
    // Se guarda el objeto de respuesta en la base de datos
    await this.resultsRepository.saveSearchResults(searchResults);
  }

  /**
   * Function to generate the search results
   * @param trainsData
   * @param journeys
   * @param passenger
   * @param bonus
   * @param tripType
   * @returns
   */
  private generateSearchResults(
    trainsData: TrainResult[],
    journeys: Journey[],
    passenger: Passenger,
    bonus: ['retired'],
    tripType,
  ): CTSearch[] {
    return trainsData.map(train => {
      return {
        parameters: {
          journeys,
          passenger,
          bonus,
        },
        train: {
          type: tripType,
          journeys: [
            {
              departure: {
                date: train.departureTime,
                time: '',
                station: train.destination,
              },
              arrival: {
                date: train.arrivalTime,
                time: '',
                station: train.arrival,
              },
              duration: {
                hours: 0,
                minutes: 0,
              },
            },
          ],
          accommodations: {
            type: train.accommodation,
            passengers: {
              adults: passenger.adults.toString(),
              children: passenger.children.toString(),
            },
          },
        },
        price: {
          total: train.price,
          breakdown: {
            adult: train.adultsPrice,
            children: train.childrenPrice,
          },
        },
      };
    });
  }

  /**
   * Function to get the trains data
   * @param fromCorrelations
   * @param toCorrelations
   * @param date
   * @param passenger
   * @param bonus
   * @returns
   */
  private async getTrainsData(
    fromCorrelations: StationCorrelation[],
    toCorrelations: StationCorrelation[],
    date: string,
    passenger: Passenger,
    bonus: string[],
  ): Promise<any> {
    try {
      const trainResults: TrainResult[] = [];
      // Obtener los códigos de estación de origen y destino
      const fromStationCodes = fromCorrelations.map((correlation: StationCorrelation) =>
        correlation.suppliers
          .filter(supplier => supplier.startsWith('SERVIVUELO#'))
          .map(supplier => supplier.split('#')[1]),
      );
      const toStationCodes = toCorrelations.map((correlation: StationCorrelation) =>
        correlation.suppliers
          .filter(supplier => supplier.startsWith('SERVIVUELO#'))
          .map(supplier => supplier.split('#')[1]),
      );
      // Se comprueba que se obtiene valores en los códigos de estación de origen y destino
      if (fromStationCodes.length === 0 || toStationCodes.length === 0) {
        throw new Error('No station codes found');
      }
      // Se obtienen los trenes disponibles para la fecha indicada en el mock de servivuelos
      const url = process.env.MOCK_SERVER || 'http://localhost:3100';
      // Se recorre el array de códigos de estación de origen
      for (const fromStationCode of fromStationCodes) {
        // Se recorre el array de códigos de estación de destino
        for (const toStationCode of toStationCodes) {
          // Se consulta al mock de servivuelos los trenes disponibles para la fecha indicada
          const response = await axios.post(
            `${url}/timetables?=adults=${passenger.adults}&childrens=${passenger.children}`,
            {
              from: fromStationCode[0],
              to: toStationCode[0],
              date,
            },
          );
          if (response.status === 200) {
            // Al obtener los trenes disponibles se termina el ciclo consultamos sus acomodaciones
            const responseAccommodations = await axios.post(`${url}/accommodations`, {
              shipID: response.data.shipID,
              departureDate: response.data.departureDate,
            });
            // Se obtiene los precios de los trenes disponibles
            const responsePrices = await axios.post(`${url}/prices`, {
              accommodation: responseAccommodations.data.type,
              shipID: response.data.shipID,
              departureDate: response.data.departureDate,
            });
            // Se calcula el precio de los trenes disponibles
            const calculatedPrices = this.calculatePrice(
              responsePrices.data.price,
              passenger,
              bonus,
            );
            // Se procede a construir el objeto de respuesta
            trainResults.push({
              destination: fromStationCode[0],
              arrival: toStationCode[0],
              departureTime: response.data.departureDate,
              accommodation: responseAccommodations.data.type,
              arrivalTime: response.data.arrivalDate,
              accommodationClass: responseAccommodations.data.class,
              price: calculatedPrices.calculatedPrice,
              adultsPrice: calculatedPrices.calculatedAdultsPrice,
              childrenPrice: calculatedPrices.calculatedChildrenPrice,
            } as TrainResult);
            // Se recorre el array de trenes disponibles
          }
        }
      }
      return trainResults;
    } catch (error) {
      // Manejo de errores
      throw new Error('Error getting train data from mock', error.message);
    }
  }

  /**
   * Function to generate the prices of the results
   * @param price Price of the train
   * @param passenger Passenger data
   * @param bonus Bonus data
   * @returns Object with the calculated prices
   */
  private calculatePrice(
    price: number,
    passenger: Passenger,
    bonus: string[],
  ): {
    calculatedPrice: number;
    calculatedAdultsPrice: number;
    calculatedChildrenPrice: number;
  } {
    // Se obtienen los datos de los pasajeros
    const { adults, children, total } = passenger;
    // Se suma el total de pasajeros
    const totalPassengers = adults + children;
    // Se verifica que el total de pasajeros sea el mismo que el recibido
    if (totalPassengers !== total) throw new Error('Total passengers does not match');
    // Se calcula el precio total
    const calculatedPrice = price * totalPassengers;
    // Se calcula el precio para adultos
    const calculatedAdultsPrice = price * adults;
    // Se calcula el precio para niños
    const calculatedChildrenPrice = price * children;
    // Se verifica si hay bonos
    if (bonus.length > 0 && bonus.includes('retired')) {
      // Se calcula el precio con bonos
      const calculatedPriceWithBonus = calculatedPrice - calculatedPrice * 0.1;
      // Se calcula el precio para adultos con bonos
      const calculatedAdultsPriceWithBonus = calculatedAdultsPrice - calculatedAdultsPrice * 0.1;
      // Se calcula el precio para niños con bonos
      const calculatedChildrenPriceWithBonus =
        calculatedChildrenPrice - calculatedChildrenPrice * 0.1;
      // Se retorna el precio calculado con bonos
      return {
        calculatedPrice: calculatedPriceWithBonus,
        calculatedAdultsPrice: calculatedAdultsPriceWithBonus,
        calculatedChildrenPrice: calculatedChildrenPriceWithBonus,
      };
    }
    // Se retorna el precio calculado
    return { calculatedPrice, calculatedAdultsPrice, calculatedChildrenPrice };
  }

  /**
   *
   * @param journeys El itinerario de viajes
   * @returns
   */
  private getTripType(journeys: Journey[]): TripType {
    // Se cuenta el numero de trayectos
    const numJourneys = journeys.length;
    // Se verifica el numero de trayectos
    // Si es 1 es de ida
    if (numJourneys === 1) {
      return TripType.ONEWAY;
    } else if (numJourneys === 2) {
      // Si es 2 se verifica que el trayecto de ida y vuelta sea el mismo
      const firstJourney = journeys[0];
      const secondJourney = journeys[1];
      // Se verifica que el trayecto de ida y vuelta sea el mismo
      if (firstJourney.from === secondJourney.to && secondJourney.from === firstJourney.to) {
        return TripType.ROUNDTRIP;
      }
    }
    // Si no es ninguno de los anteriores es multi destino
    return TripType.MULTIDESTINATION;
  }
}

export default SearchData;
