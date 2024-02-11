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
interface Room {
  id: string;
  name: string;
  players: Player[];
}

interface UserFormTopics {
  Nome: string;
  Lugar: string;
  Animal: string;
  Cor: string;
  Comida: string;
  Objeto: string;
  'Profissão': string;
  FDN: string;
  'Parte do corpo': string;
}

interface SendForm{
  userId: string
  form: UserFormTopics
}

const players: Player[] = [];
const rooms: Room[] = [];

console.log(rooms)

function generateRoomId(): string {
  // Lógica para gerar um ID único para a sala
  // Isso pode ser um UUID ou qualquer outra estratégia de geração de ID
  return Math.random().toString(36).substr(2, 9);
}

io.on('connection', (socket: Socket) => {
  console.log('Novo jogador conectado');

  socket.on('createRoom', (roomName: string) => {
    const roomId = generateRoomId(); // Gere um ID único para a sala
    const newRoom: Room = { id: roomId, name: roomName, players: [] };
    rooms.push(newRoom);
    io.emit('updateRooms', rooms);
  });

  socket.on('joinRoom', (roomId: string) => {
    const room = rooms.find((room) => room.id === roomId);
    if (room) {
      room.players.push({ id: socket.id, name: 'Player' + (room.players.length + 1) });
      io.emit('updateRooms', rooms);
    } else {
      console.log(`Sala não encontrada com o ID ${roomId}`);
    }
  });

  socket.on('updateName', (newName: string) => {
    const playerIndex = players.findIndex((player) => player.id === socket.id);
    if (playerIndex !== -1) {
      players[playerIndex].name = newName;
      io.emit('updatePlayers', players);
    }
  });

  socket.on('sendForm', (userForm: SendForm) => {
    console.log('Formulário recebido do jogador:', userForm);

  
    io.emit('formReceived', `Formulário recebido com sucesso do jogador ${userForm.userId}`);
  });

  players.push({ id: socket.id, name: 'Player' + (players.length + 1) });

  io.emit('updatePlayers', players);
  io.emit('updateRooms', rooms);

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

// Exemplo básico para controlar o tempo de cada rodada
let currentRound = 1;
const roundDurationInSeconds = 60; // por exemplo, 60 segundos por rodada

io.on('connection', (socket: Socket) => {
  // ...

  socket.on('startRound', () => {
    // Inicie uma nova rodada
    io.emit('newRound', currentRound);

    // Configure um temporizador para finalizar a rodada após o tempo especificado
    setTimeout(() => {
      io.emit('endRound', currentRound);

      // Adicione lógica para calcular pontuações, se necessário
      // ...

      currentRound++;
    }, roundDurationInSeconds * 1000);
  });

  // ...
});

// Exemplo básico usando um array para armazenar resultados
const gameHistory: { round: number; scores: Record<string, number> }[] = [];

io.on('connection', (socket: Socket) => {
  // ...

  socket.on('endRound', (roundData) => {
    // Salve os resultados no histórico
    gameHistory.push({ round: roundData.round, scores: roundData.scores });
    io.emit('updateGameHistory', gameHistory);
  });

  // ...
});

io.on('connection', (socket: Socket) => {
    // ...
  
    socket.on('submitAnswer', (answer: string) => {
      // Adicione lógica de validação para evitar respostas inválidas
      if (isValidAnswer(answer)) {
        // Processar a resposta
        io.emit('answerProcessed', { playerId: socket.id, answer });
      } else {
        // Resposta inválida, informar ao jogador
        socket.emit('invalidAnswer', 'Resposta inválida');
      }
    });
  
    // ...
  });
  
  function isValidAnswer(answer: string): boolean {
    // Adicione sua lógica de validação aqui (por exemplo, evitar palavras proibidas)
    return answer.length > 0;
  }
  


const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor WebSocket rodando na porta ${PORT}`);
});
