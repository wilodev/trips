import SearchData from '../../app/search/useCase/SearchData';
import { validateParameters } from '../../services/searchService';
import { Parameters } from '@/types';
import { Router, Request, Response } from 'express';
import MongoDBConnection from '../../infra/MongoDBConnection';
// Se crea un router para manejar las rutas de la aplicación
const searchRouter = Router();

searchRouter.post('/', async (req: Request, res: Response) => {
  try {
    const requestBody: Parameters = req.body;
    // Establecer la conexión a MongoDB
    const mongoDBConnection = MongoDBConnection;
    await mongoDBConnection.connect();
    const db = mongoDBConnection.getDb();
    const searchData = new SearchData(db);
    // Validar la estructura del cuerpo de la solicitud
    validateParameters(requestBody);
    // Llamar al servicio de búsqueda
    await searchData.performSearch(requestBody.journeys, requestBody.passenger, requestBody.bonus);
    res.status(200).json({
      journeys: requestBody.journeys,
      passenger: requestBody.passenger,
      bonus: requestBody.bonus,
      message: 'Search performed successfully',
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default searchRouter;
