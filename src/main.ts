import * as express from 'express';
import searchRouter from './presentation/routes/searchRoute';
const app = express();
const port = 3000;

// app.post('/', (req, res) => {
//   const body: Parameters = req.body;

//   res.send('Hello World!');
// });
app.use(express.json());
app.use('/servivuelo', searchRouter);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
