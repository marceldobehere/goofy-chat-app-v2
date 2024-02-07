import * as sec from './sec.js';
import * as enc from './enc.js';

let io;
export let userSocketDict;
let tempSocketVerifyMap;


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

function listUserDict()
{
    console.log("USER DICT: ");
    for (let key in userSocketDict)
        console.log(`  ${key}: ${userSocketDict[key].length}`);
}

function listVerifyDict()
{
    console.log("VERIFY DICT: ");
    for (let [key, value] of tempSocketVerifyMap)
        console.log(`  ${key.id}: ${JSON.stringify(value)}`);

}

export async function initApp(_io)
{
    io = _io;
    userSocketDict = {};
    tempSocketVerifyMap = new Map();

    io.on('connection', (socket) => {
        console.log('> User connected');
        tempSocketVerifyMap.set(socket, {});

        socket.on('disconnect', () => {
            console.log('> User disconnected');
            tempSocketVerifyMap.delete(socket);
            removeSocketsFromDict(socket);

            // listUserDict();
            // listVerifyDict();
        });

        socket.on('login-1', (obj) => {
            let pubKey = obj["public-key"];
            if (pubKey === undefined)
                return socket.emit('login-1', {error: "Missing public key"});

            let phrase = sec.makeRandomString(10);

            let phaseEnc = enc.encryptString(phrase, pubKey);
            if (phaseEnc === undefined)
                return socket.emit('login-1', {error: "Failed to encrypt phrase"});

            tempSocketVerifyMap.get(socket)["phrase"] = phrase;
            tempSocketVerifyMap.get(socket)["public-key"] = pubKey;

            console.log(`> LOGIN (1/2) [${socket.id}]: \"${phaseEnc}\" -> \"${phrase}\"`);
            socket.emit('login-1', {"phrase": phaseEnc});

            // listVerifyDict();
        });

        socket.on('login-2', (obj) => {
            let phrase = obj["phrase"];
            if (phrase === undefined)
                return socket.emit('login-2', {error: "Missing phrase"});
            if (tempSocketVerifyMap.get(socket)["phrase"] === undefined)
                return socket.emit('login-2', {error: "No login-1"});

            let actualPhrase = tempSocketVerifyMap.get(socket)["phrase"];
            let pubKey = tempSocketVerifyMap.get(socket)["public-key"];
            tempSocketVerifyMap.set(socket, {});

            if (phrase !== actualPhrase)
            {
                console.log(`> LOGIN FAILED (2/2) [${socket.id}]: \"${phrase}\" != \"${actualPhrase}\"`);
                return socket.emit('login-2', {error: "Invalid phrase"});
            }

            let userId = sec.hashString(pubKey);

            console.log(`> LOGIN (2/2) [${socket.id}]: (${userId}) SUCCESS!`);
            addSocketToUser(userId, socket);
            socket.emit('login-2', {userId: userId});

            // listUserDict();
            // listVerifyDict();
        });
    });
}