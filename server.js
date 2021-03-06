require("dotenv").config();
const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const dateFormat = require("date-format");
const nodemailer = require("nodemailer");
// const socket = require("socket.io");
// const io = socket(server);

const {
  addUser,
  getListUserByRoom,
  removeUser,
  getUserById,
  getUserByName,
  getListUser,
} = require("./user");

const cors = require("cors");
const { Socket } = require("socket.io");
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
    if (roomID.length < 50) {
      if (limit.length < 3) {
        if (Number.isInteger(Number(limit)) && limit >= 2 && limit <= 10) {
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
          socketToRoom[socket.id] = roomID;
          const usersInThisRoom = users[roomID].filter(
            (id) => id !== socket.id
          );
          socket.emit("all users", usersInThisRoom);
          socket.on("disconnect", () => {
            const roomID = socketToRoom[socket.id];
            let room = users[roomID];
            if (room) {
              room = room.filter((id) => id !== socket.id);
              users[roomID] = room;
            }
            console.log(`client ${socket.id} disconnect`);
            removeUser(socket.id);
            const userId = socket.id;
            socket.broadcast.to(room).emit("user-disconnected", { userId });
          });

          // chat
          socket.on("join-room-client-to-server", ({ roomID, username }) => {
            // t???o ph??ng
            socket.join(roomID.toString());
            console.log("New Client Connected", socket.id);
            if (
              roomID.length < 100 &&
              username.length <= 14 &&
              username !== ""
            ) {
              if (getUserByName(username)) {
                socket.emit("err name", username);
              } else {
                // t???o user
                addUser({
                  id: socket.id,
                  room: roomID,
                  username: username,
                });

                // x??? l?? danh s??ch user trong 1 ph??ng
                const userList = getListUserByRoom(roomID);
                io.to(roomID).emit("send-user-list-server-to-client", userList);

                // nh???n tin nh???n t??? client l??n tr??n server
                socket.on(
                  "send-messages-client-to-server",
                  (message, callback) => {
                    if (message.length <= 100 && message !== "") {
                      const infoMessage = {
                        id: socket.id,
                        content: message,
                        username: getUserById(socket.id).username,
                        time: dateFormat("dd/MM/yyyy - hh:mm:ss", new Date()),
                      };

                      //g???i ng?????c l???i tin nh???n t??? server v??? clinet
                      // socket.emit("send-messages-client-to-server", message); => SAI
                      io.to(roomID.toString()).emit(
                        "send-messages-client-to-server",
                        infoMessage
                      );

                      // g???i l???i asknowledgement
                      callback();
                    } else {
                      console.log("The limit is 100 words");
                    }
                  }
                );
              }
            } else {
              console.log("There is an err with roomID and username");
            }
          });
        }
      }
    } else {
      socket.emit("room full");
    }
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
});

app.post("/send_mail", (req, res) => {
  let { roomId, email } = req.body;

  if (roomId != "" && email != "" && email.length < 50 && roomId.length < 100) {
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
        res.status(404).send("Error occurs", err);
      } else {
        res.status(200).send("Email sent!!!");
      }
    });
  } else {
    res.status(404).send("Email or Link RoomID is err");
  }
});

app.get("/", (req, res) => {
  res.send("Hello");
});

const PORT = process.env.PORT || 9500;
server.listen(PORT, () => console.log("server is running on port", PORT));
