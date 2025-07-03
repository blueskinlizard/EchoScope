const express = require('express')
const cors = require("cors");
const http = require("http"); 

const file_routes = require('./fileRoutes')


const app = express();
const PORT = 8080;
const server = http.createServer(app);

const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
};
app.use(cors(corsOptions));

app.use(express.json()); 
app.use(express.urlencoded({ extended: false }));

app.use('/api/', file_routes);

server.listen(PORT, () =>{
    console.log(`App running up on port: ${PORT}`)
})