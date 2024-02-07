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
import * as userInterface from "./lib/userInterface.js";
import * as messageManager from "./lib/messageManager.js";
import {backUpMessages} from "./lib/messageManager.js";


await userInterface.initApp();
await socketSessionManager.initApp(io, userInterface);
await messageManager.initApp(io, userInterface, socketSessionManager);

nodeCleanup(function (exitCode, signal) {
    messageManager.backUpMessages();
});