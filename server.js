require("dotenv").config();
const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const nodemailer = require("nodemailer");
// const socket = require("socket.io");
// const io = socket(server);

const cors = require("cors");
app.use(cors());
app.options("*", cors());

app.use(express.json());

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const users = {};
const socketToRoom = {};

io.on("connection", (socket) => {
  socket.on("join room", (roomID, limit) => {
    if (users[roomID]) {
      const length = users[roomID].length;
      if (length == limit) {
        socket.emit("room full");
        return;
      }
      users[roomID].push(socket.id);
    } else {
      users[roomID] = [socket.id];
    }
    console.log(limit);
    socketToRoom[socket.id] = roomID;
    const usersInThisRoom = users[roomID].filter((id) => id !== socket.id);

    socket.emit("all users", usersInThisRoom);
  });

  socket.on("sending signal", (payload) => {
    io.to(payload.userToSignal).emit("user joined", {
      signal: payload.signal,
      callerID: payload.callerID,
    });
  });

  socket.on("returning signal", (payload) => {
    io.to(payload.callerID).emit("receiving returned signal", {
      signal: payload.signal,
      id: socket.id,
    });
  });

  socket.on("disconnect", () => {
    const roomID = socketToRoom[socket.id];
    let room = users[roomID];
    if (room) {
      room = room.filter((id) => id !== socket.id);
      users[roomID] = room;
    }
  });
});

app.post("/send_mail", (req, res) => {
  let { roomId, email } = req.body;

  if (roomId != "" && email != "") {
    // Step 1
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "eliottran268@gmail.com",
        pass: "hotboyhotboy",
      },
    });

    const emailUser = email.trim();
    // Step 2
    let mailOptions = {
      from: "eliottran268@gmail.com", // TODO: email sender
      to: emailUser, // TODO: email receiver
      subject: "Online Meeting Room",
      text: roomId,
    };

    // Step 3
    transporter.sendMail(mailOptions, (err, data) => {
      if (err) {
        console.log("Error occurs", err);
      } else {
        console.log("Email sent!!!", data);
      }
    });
  } else {
    res.status(404).send("Email or Link RoomID is err");
  }
});

app.get("/", (req, res) => {
  res.send("Hello");
});
server.listen(9500, () => console.log("server is running on port 9500"));
