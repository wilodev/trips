export interface StationMapping {
  destinationCode: string;
  arrivalCode: string;
  destinationTree: string[];
  arrivalTree: string[];
}

export interface StationCorrelation {
  code: string;
  suppliers: string[];
}

export interface TrainResult {
  destination: string;
  arrival: string;
  departureTime: string;
  accommodation: string;
  arrivalTime: string;
  accommodationClass: string;
  price: number;
  adultsPrice: number;
  childrenPrice: number;
}

export interface Journey {
  /** puerto, estación, cuidad, o país de salida */
  from: string;
  /** puerto, estación, cuidad, o país de llegada */
  to: string;
  /** dia de salida del viaje */
  date: string;
}

export interface Passenger {
  /** Numero de adultos */
  adults: number;
  /** Numero de niños */
  children: number;
  /** Total de pasajeros */
  total: number;
}

export enum TripType {
  ONEWAY = 'oneway',
  ROUNDTRIP = 'roundtrip',
  MULTIDESTINATION = 'multidestination',
}
