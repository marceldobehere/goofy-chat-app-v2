let serverSocketList = [];
let serverStatusList = [];
async function createSockets(serverList, user)
{
    serverSocketList = [];
    let listIndex = 0;
    for (let addr of serverList)
    {
        let socket = createSocket(addr);
        serverSocketList.push(socket);
        serverStatusList.push(false);

        let promiseArray = [];
        let promiseDone = false;
        let sockPromise = new Promise((resolve, reject) => {
            socket.on('connect', () => {
                logInfo("> Server connected.");
                serverStatusList[listIndex] = true;

                let res = (async () => {
                    await login(socket, user["mainAccount"]);
                    await login(socket, user["listenerAccount"]);
                })();

                if (!promiseDone)
                {
                    promiseDone = true;
                    promiseArray.push(res);
                    resolve();
                }
            });
        });

        socket.on('disconnect', () => {
            logInfo("> Server disconnected.");
            serverStatusList[listIndex] = false;
        });

        socket.on('error', (error) => {
            logWarn(`> Server error: ${error}`);
        });

        socket.on('connect_error', (error) => {
            logWarn(`> Server connect error: ${error}`);
        });

        await sockPromise;
        for (let promise of promiseArray)
            await promise;
        listIndex++;
    }
}

function createSocket(addr)
{
    let connectionOptions =  {
        "force new connection" : true,
        "reconnectionAttempts": "Infinity", //avoid having user reconnect manually in order to prevent dead clients after a server restart
        "timeout" : 10000, //before connect_error and connect_timeout are emitted.
        "transports" : ["websocket", "polling"]
    };

    if (addr.startsWith("https://"))
        connectionOptions["secure"] = true;

    return io(addr, connectionOptions);
}

async function login(socket, account)
{
    logInfo(`> Logging in as ${account["userId"]}`);
    let pubKey = account["public-key"];

    let reply1 = await msgSendAndGetReply(socket, "login-1", { "public-key": pubKey });
    if (reply1["error"])
    {
        alert(`Error: ${reply1["error"]}`);
        return false;
    }
    logInfo(reply1);

    let encryptedPhrase = reply1["phrase"];
    if (encryptedPhrase === undefined)
    {
        alert("Error: Server did not send encrypted phrase");
        return false;
    }

    let decryptedPhrase = accDecRsa(encryptedPhrase, account);
    if (decryptedPhrase === undefined)
    {
        alert("Error: Could not decrypt phrase");
        return false;
    }
    logInfo(`> Decrypted phrase: ${decryptedPhrase}`);

    if (decryptedPhrase.length != 10)
    {
        alert("Error: Decrypted phrase is not 10 characters long");
        return false;
    }

    let reply2 = await msgSendAndGetReply(socket, "login-2", { "phrase": decryptedPhrase});
    if (reply2["error"])
    {
        alert(`Error: ${reply2["error"]}`);
        return false;
    }
    logInfo(reply2);
}

