import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from "cors"

const app = express();
app.use(cors())
const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });
interface Player {
  id: string;
  name: string;
}

const players: Player[] = [];

io.on('connection', (socket: Socket) => {
  console.log('Novo jogador conectado');

  players.push({ id: socket.id, name: 'Player' + (players.length + 1) });

  io.emit('updatePlayers', players);

  socket.on('submitAnswer', (answer: string) => {
    console.log(`${socket.id} enviou a resposta: ${answer}`);
    // Lógica para processar a resposta do jogador
  });

  socket.on('disconnect', () => {
    console.log('Jogador desconectado');
    const index = players.findIndex((player) => player.id === socket.id);
    if (index !== -1) {
      players.splice(index, 1);
      io.emit('updatePlayers', players);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor WebSocket rodando na porta ${PORT}`);
});
