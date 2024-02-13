import express, { Router } from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());
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

interface Score extends Player {
  hits: number;
  points: number;
}

interface RoomState {
  id: string;
  name: string;
  players: Player[];
  currentRound: number;
  duration: number;
  timer: number;
  letter: string;
  answers: Answers[];
  winner: Score | undefined;
  scores: Score[];
}
interface UserFormTopics {
  Nome: string;
  Lugar: string;
  Animal: string;
  Cor: string;
  Comida: string;
  Objeto: string;
  Profissão: string;
  FDN: string;
  "Parte do corpo": string;
}

interface SendForm {
  userID: string;
  userName: string;
  form: UserFormTopics;
}
interface Answers {
  userID: string;
  userName: string;
  form: UserFormTopics;
  hits: number;
}

const players: Player[] = [];
const rooms: RoomState[] = [];
const forms: SendForm[] = [];
let answers: Answers[] = [];

function generateRoomId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function getScores(roomID: string) {
  if (rooms.length) {
    const room = rooms.find((item) => item.id === roomID);
    if (room) {
      const res: Score[] = [];
      if (room.answers) {
        room.answers.forEach((form) => {
          const data = [];
          if (form) {
            for (const key in form.form) {
              data.push(form.form[key]);
            }
            room.scores.push({
              id: form.userID,
              name: room.players.find((item) => item.id === form.userID)?.name,
              hits: data.filter((item) => item === true).length,
              points: data.filter((item) => item === true).length * 10,
            });
          }
        });
      }

      if (room.scores.length > 0) {
        const winnerHits = Math.max(
          ...room.scores.map((player) => player.hits)
        );
        const winnerPlayer = room.scores.find(
          (player) => player.hits === winnerHits
        );

        room.winner = winnerPlayer;
      }
    }
  }
}

function validateString(word: string, letter: string) {
  if (word && word !== "" && word.toLowerCase() === letter.toLowerCase()) {
    return true;
  } else {
    return false;
  }
}

function validateAnswers(roomID: string) {
  if (rooms.length) {
    const room = rooms.find((item) => item.id === roomID);
    if (room) {
      room.players.map((player) => {
        if (forms.findIndex((form) => form.userID === player.id) !== -1) {
          const form = forms.find((form) => form.userID === player.id);
          if (form) {
            for (const key in form.form) {
              if (form.form) {
                const startsWithA = validateString(
                  form.form[key as keyof UserFormTopics][0],
                  room.letter
                );
                form.form[key as keyof UserFormTopics] = startsWithA;
              }
            }
            form.userName;
          }

          room.answers.push(form);
        }
      });
    }
    console.log(room);
    // io.emit("updateAnswers", answers);
  }
  //   const mockForm =
  //     {
  //       userID: 'bbFRUMoic_gLw2pTAAAP',
  //       form: {
  //         Nome: 'asd',
  //         Lugar: 'asd',
  //         Animal: 'asd',
  //         Cor: 'asdasd',
  //         Comida: 'asd',
  //         Objeto: 'asd',
  //         'Profissão': 'asd',
  //         FDN: 'ssd',
  //         'Parte do corpo': 'as'
  //       },
  //       hits: 0
  //     } as SendForm

  //     for (const key in mockForm.form) {
  //       const startsWithA = mockForm.form[key as keyof UserFormTopics][0].toLowerCase() === 'a';
  //       mockForm.form[key as keyof UserFormTopics] = startsWithA;
  //     }
  // // console.log(result)
  //     answers.push(mockForm)
  //     console.log(answers)
}

// validateAnswers()

function startTimerForRoom(room: RoomState) {
  let timerInterval: NodeJS.Timeout;
  timerInterval = setInterval(() => {
    room.timer--;
    io.emit("updateRooms", rooms);
    if (room.timer <= 0) {
      io.to(room.id).emit("endRound", room.currentRound);
      io.to(room.id).emit("startRound", undefined);
      room.currentRound++;
      validateAnswers(room.id);
      getScores(room.id);
      io.emit("updateRooms", rooms);
      clearInterval(timerInterval);
    } else {
      io.emit("updateRoom", rooms);
    }
  }, 1000);
}

function startGameForRoom(room: RoomState) {
  room.timer = room.duration ;
  room.winner = undefined;
  room.scores = [];
  answers = [];
  startTimerForRoom(room);
  io.emit("updateAnswers", answers);
  // io.emit("updateRooms", rooms);
  io.emit("gameStarted", room.currentRound);
  io.to(room.id).emit("endRound", undefined);
  io.to(room.id).emit("startRound", room.currentRound);
}

io.on("connection", (socket: Socket) => {
  socket.on("createRoom", (roomName: string) => {
    const roomId = generateRoomId();
    const newRoom: RoomState = {
      id: roomId,
      name: roomName,
      players: [],
      currentRound: 1,
      duration: 60, 
      timer: 60,
      letter: "a",
      answers: [],
      scores: [],
      winner: undefined,
    };
    rooms.push(newRoom);
    io.emit("updateRooms", rooms);
  });

  socket.emit("client_id", socket.id);
  socket.emit("updateForms", forms);

  socket.on("joinRoom", (roomId: string) => {
    const room = rooms.find((room) => room.id === roomId);
    if (!room) {
      console.log(`Sala não encontrada com o ID ${roomId}`);
      return;
    }
    socket.join(roomId);
    const inRoom = room?.players.findIndex((player) => player.id === socket.id);
    if (inRoom === -1) {
      if (room) {
        if (
          players &&
          players.findIndex((player) => player.id === socket.id) !== -1
        ) {
          room.players.push({
            id: socket.id,
            name: players.find((player) => player.id === socket.id).name,
          });
        } else {
          room.players.push({
            id: socket.id,
            name: "Jogador" + (room.players.length + 1),
          });
        }
        io.emit("updateRooms", rooms);
      }
    } else {
      console.log(
        `Jogador ${
          room?.players.find((player) => player.id === socket.id).name
        }, já está na sala`
      );
    }
  });

  socket.on("updateName", (newName: string) => {
    const playerIndex = players.findIndex((player) => player.id === socket.id);
    if (playerIndex !== -1) {
      players[playerIndex].name = newName;
      io.emit("updatePlayers", players);
    } else {
      players.push({ id: socket.id, name: newName });
    }
  });

  socket.on("sendForm", (userForm: SendForm) => {
    const existingFormIndex = forms.findIndex(
      (item) => item.userID === userForm.userID
    );
    if (existingFormIndex !== -1) {
      forms[existingFormIndex].form = userForm.form;
    } else {
      forms.push(userForm);
    }
    io.emit("updateForms", forms);
    io.emit("formReceived", forms);
  });

  socket.on("startGame", (roomID: string, letter: string) => {
    const room = rooms.find((room) => room.id === roomID);
    if (!room) {
      return;
    }
    room.letter = letter
    startGameForRoom(room);
  });

  io.emit("updatePlayers", players);
  io.emit("updateRooms", rooms);

  socket.on("submitAnswer", (answer: string) => {
    // Lógica para processar a resposta do jogador
  });

  socket.on("disconnect", () => {
    const index = players.findIndex((player) => player.id === socket.id);
    if (index !== -1) {
      players.splice(index, 1);
      io.emit("updatePlayers", players);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor WebSocket rodando na porta ${PORT}`);
});
