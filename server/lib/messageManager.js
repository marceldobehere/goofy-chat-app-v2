import * as utils from '../other/utils.js';

let io;
let userInterface;
let socketSessionManager;

let pendingMsgArr;

function addSendMessage(mail)
{
    console.log("> Trying to send message: ", mail);
    pendingMsgArr.push(mail);
    trySendingMessages();
}

function trySendingMessages()
{
    if (pendingMsgArr.length == 0)
        return;

    for (let i = 0; i < pendingMsgArr.length; i++)
    {
        let mail = pendingMsgArr[i];
        if (trySendMessage(mail))
        {
            pendingMsgArr.splice(i, 1);
            i--;
        }
    }
}

function trySendMessage(mail)
{
    let sockets = socketSessionManager.getSocketsForUser(mail["to"]);
    if (sockets === undefined)
        return false;

    for (let socket of sockets)
        socket.emit('message', mail);

    console.log(`> Message sent to ${mail["to"]}`);
    return true;
}

export function backUpMessages()
{
    console.log("> Backing up messages to ./data/mails.json");
    Deno.writeTextFileSync("./data/mails.json", JSON.stringify(pendingMsgArr));
}

function tryLoadingMessages()
{
    if (utils.thingExists("./data/mails.json"))
    {
        console.log("Loading messages from ./data/mails.json");
        try
        {
            let data = Deno.readTextFileSync("./data/mails.json");
            pendingMsgArr = JSON.parse(data);
            console.log(`Loaded ${pendingMsgArr.length} messages`);
        }
        catch (e)
        {
            console.log(`Error loading messages: ${e}`);
            pendingMsgArr = [];
        }
    }
}

export async function initApp(_io, _userInterface, _socketSessionManager)
{
    io = _io;
    userInterface = _userInterface;
    socketSessionManager = _socketSessionManager;
    pendingMsgArr = [];
    tryLoadingMessages();
    setInterval(backUpMessages, 1000 * 60 * 60); // 1 hour

    io.on('connection', (socket) => {
        socket.on('get-pub-key', async (userId) => {
            let user = await userInterface.getUser(userId);
            if (user === undefined)
                return socket.emit('get-pub-key', {error: "User not found"});
            socket.emit('get-pub-key', {"public-key": user["public-key"]});
        });

        socket.on('get-messages', (obj) => {
            trySendingMessages();
        });

        socket.on('send-message', (obj) => {
            // {from: accountFrom, to: userIdTo, data: data};
            let userIdFrom = obj["from"];
            let userIdTo = obj["to"];
            let data = obj["data"];
            if (userIdFrom === undefined || userIdTo === undefined || data === undefined)
                return socket.emit('send-message', {error: "Missing data"});

            if (!socketSessionManager.socketBelongsToUser(socket, userIdFrom))
                return socket.emit('send-message', {error: "Invalid user"});

            let mail = {
                from: userIdFrom,
                to: userIdTo,
                date: new Date(),
                data: data
            };

            socket.emit('send-message', {});

            addSendMessage(mail);
        });
    });


    console.log("> User/Message manager initialized");
}