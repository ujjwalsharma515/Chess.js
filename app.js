const express = require("express");
const socket = require("socket.io");
const http = require('http');
const {Chess} = require("chess.js");
const path = require("path");
const { title } = require("process");
const dotenv = require("dotenv")
dotenv.config();


const app = express();
const port = process.env.PORT;

const server = http.createServer(app)
const io = socket(server)
const chess = new Chess();
let players={};
let currentPlayer ="w";
app.set("view engine","ejs");
app.use(express.static(path.join(__dirname,"public")));

app.get("/",(req,res)=>{
res.render("index",{title:"chess game"});
})

io.on("connection", function(uqsocket){
    console.log("connected")
   if(!players.white){
    players.white=uqsocket.id;
    uqsocket.emit("playerRole","w")
   }
   else if(!players.black){
    players.black=uqsocket.id;
    uqsocket.emit("playerRole","b")
   }
   else{
     uqsocket.emit("spectatorRole")
       
   }
   uqsocket.on("disconnect",function(){
    if(uqsocket.id==players.white){
      delete players.white;
    }
    else if(uqsocket.id==players.black){
      delete players.black;
    }
   })

   uqsocket.on("move",(move)=>{
    try {
      if(chess.turn()==='w'&& uqsocket.id !== players.white)return;
      if(chess.turn()==='b'&& uqsocket.id !== players.black)return;
      const result = chess.move(move);
      if(result){
        currentPlayer = chess.turn();
        io.emit("move",move);
        io.emit("boardState", chess.fen())
      }
      else{
        console.log("invalid move : ", move)
        uqsocket.emit("invalidMove", move)
      }
    } catch (error) {
      console.log(error);
      uqsocket.emit("invalidMove",move)
    }
   })
})

// --------------deployment-----------------------
// if (process.env.NODE_ENV === "production") {
//   app.use(express.static(path.join(__dirname, "../public/dist")));

//   app.get("*", (req, res) => {
//     res.sendFile(path.join(__dirname, "../public", "dist", "index.html"));
//   });
// }

server.listen(port,function(){
    console.log("listening on port: ", port)
})