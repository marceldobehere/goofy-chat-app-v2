import {startServer, app, server} from './minServer.js';
import nodeCleanup from "./other/nodeCleanup.js";

startServer();

app.get("/", (req, res) => {
    res.send("Welcome to the Dinosaur API!");
});

//const { Server } = require("socket.io");
import {Server} from "npm:socket.io@4.7.2";
const io = new Server(server);

io.setMaxListeners(1000);

import * as socketSessionManager from "./lib/socketSessionManager.js";

await socketSessionManager.initApp(io);

nodeCleanup(function (exitCode, signal) {
    console.log("> EXIT");
});