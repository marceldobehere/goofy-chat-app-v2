let serverSocketList = [];
function createSockets(serverList, user)
{
    for (let addr of serverList)
    {
        let socket = createSocket(addr);

        socket.on('connect', () => {
            console.log("> Server connected.");
            (async () => {
                await login(socket, user["mainAccount"]);
                await login(socket, user["listenerAccount"]);
            })().then();
        });

        socket.on('disconnect', () => {
            console.log("> Server disconnected.");
        });
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
    console.log(`> Logging in as ${account["userId"]}`);
    let pubKey = account["public-key"];
    let privKey = account["private-key"];
    let userId = account["userId"];

    let reply1 = await msgSendAndGetReply(socket, "login-1", { "public-key": pubKey });
    if (reply1["error"])
    {
        alert(`Error: ${reply1["error"]}`);
        return false;
    }
    console.log(reply1);

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
    console.log(`> Decrypted phrase: ${decryptedPhrase}`);

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
    console.log(reply2);
}

