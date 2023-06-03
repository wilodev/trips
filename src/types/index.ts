import { Journey, Passenger, TripType } from '@/interfaces/SearchInterfaces';

/** ## Tipado de los parámetros de entrada */
export type Parameters = {
  /** listado de viajes */
  journeys: Journey[];
  /** Pasajeros del trayecto */
  passenger: Passenger;
  /** Descuentos especiales, como jubilado */
  bonus: ['retired'];
};

/** ## Tipado del objeto que guardamos en la DB */
export type CTSearch = {
  /** Los parámetros de entrada que recibimos de la peticion */
  parameters: Parameters;
  train: {
    /** Tipo de viaje, oneway si solo tiene un journey,
     * multi-destination si tiene mas de 1,
     * y roundtrip si tiene 2 journey y vuelve al mismo sitio desde el que salió  */
    type: TripType;
    /** Array con cada uno de los viajes, recordemos que si es roundtrip seran 2 */
    journeys: {
      /** Información de salida */
      departure: {
        /** Fecha en formato DD/MM/YYYY */
        date: string;
        /** Hora en formato HH:mm */
        time: string;
        /** Código de la estación (nuestros códigos, no los de proveedor) */
        station: string;
      };
      /** Información de llegada */
      arrival: {
        /** Fecha en formato DD/MM/YYYY */
        date: string;
        /** Hora en formato HH:mm */
        time: string;
        /** Código de la estación (nuestros códigos, no los de proveedor) */
        station: string;
      };
      /** Duración del viaje */
      duration: {
        hours: number;
        minutes: number;
      };
    }[];
    /** Objeto de acomodación seleccionada */
    accommodations: {
      /** Código de la acomodación ej: Estandar, Confort, Premium, ... */
      type: string;
      /** Pasajeros que van en esta acomodación */
      passengers: {
        adults: string;
        children: string;
      };
    };
  };
  /** Objeto con los precios de la acomodación, horario, y trayecto anteriores */
  price: {
    /** Precio total de todo el trayecto */
    total: number;
    /** Desglose de precios */
    breakdown: {
      /** Precio por cada adulto */
      adult: number;
      /** Precio por cada niño */
      children: number;
    };
  };
};
