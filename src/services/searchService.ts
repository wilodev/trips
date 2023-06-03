import { Parameters } from '@/types';

export function validateParameters(params: Parameters): void {
  if (!Array.isArray(params.journeys) || params.journeys.length === 0) {
    throw new Error('Invalid journeys parameter');
  }
  for (const journey of params.journeys) {
    if (
      !journey.from ||
      !journey.to ||
      !journey.date ||
      typeof journey.from !== 'string' ||
      typeof journey.to !== 'string' ||
      typeof journey.date !== 'string'
    ) {
      throw new Error('Invalid journey parameter');
    }
  }
  if (
    !params.passenger ||
    typeof params.passenger.adults !== 'number' ||
    typeof params.passenger.children !== 'number' ||
    typeof params.passenger.total !== 'number'
  ) {
    throw new Error('Invalid passenger parameter');
  }

  if (!Array.isArray(params.bonus) || (params.bonus.length > 0 && params.bonus[0] !== 'retired')) {
    throw new Error('Invalid bonus parameter');
  }
}
