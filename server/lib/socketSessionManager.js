import * as sec from './sec.js';
import * as enc from './enc.js';

let io;
export let userSocketDict;
export let tempSocketVerifyDict;



function removeSocketsFromDict(socket)
{
    for (let key in userSocketDict)
    {
        let arr = userSocketDict[key];
        let index = arr.indexOf(socket);
        if (index > -1)
            arr.splice(index, 1);
        if (arr.length == 0)
            delete userSocketDict[key];
    }
}

function addSocketToUser(userId, socket)
{
    if (userSocketDict[userId])
        userSocketDict[userId].push(socket);
    else
        userSocketDict[userId] = [socket];
}

export async function initApp(_io)
{
    io = _io;
    userSocketDict = {};
    tempSocketVerifyDict = {};

    io.on('connection', (socket) => {
        console.log('> User connected');
        tempSocketVerifyDict[socket] = {};

        socket.on('disconnect', () => {
            console.log('> User disconnected');
            delete tempSocketVerifyDict[socket];
            removeSocketsFromDict(socket);
        });

        socket.on('login-1', (obj) => {
            let pubKey = obj["public-key"];
            if (pubKey === undefined)
                return socket.emit('login-1', {error: "Missing public key"});

            let phrase = sec.makeRandomString(10);

            let phaseEnc = enc.encryptString(phrase, pubKey);
            if (phaseEnc === undefined)
                return socket.emit('login-1', {error: "Failed to encrypt phrase"});

            tempSocketVerifyDict[socket]["phrase"] = phrase;
            tempSocketVerifyDict[socket]["public-key"] = pubKey;

            console.log(`> LOGIN (1/2) [${socket.id}]: \"${phaseEnc}\" -> \"${phrase}\"`);
            socket.emit('login-1', {"phrase": phaseEnc});
        });

        socket.on('login-2', (obj) => {
            let phrase = obj["phrase"];
            if (phrase === undefined)
                return socket.emit('login-2', {error: "Missing phrase"});
            if (tempSocketVerifyDict[socket] === undefined)
                return socket.emit('login-2', {error: "No login-1"});

            let actualPhrase = tempSocketVerifyDict[socket]["phrase"];
            let pubKey = tempSocketVerifyDict[socket]["public-key"];
            tempSocketVerifyDict[socket] = {};

            if (phrase !== actualPhrase)
            {
                console.log(`> LOGIN FAILED (2/2) [${socket.id}]: \"${phrase}\" != \"${actualPhrase}\"`);
                return socket.emit('login-2', {error: "Invalid phrase"});
            }

            let userId = sec.hashString(pubKey);

            console.log(`> LOGIN (2/2) [${socket.id}]: (${userId}) SUCCESS!`);
            addSocketToUser(userId, socket);
            socket.emit('login-2', {userId: userId});
        });
    });
}