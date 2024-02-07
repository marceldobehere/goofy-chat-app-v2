let serverList;
let currentUser;

function initUserStuff()
{
    currentUser = loadObject("currentUser");
    if (currentUser == null)
    {
        currentUser = createUser();
        saveObject("currentUser", currentUser);
    }
    logTxt(`Current User: (Main: ${currentUser["mainAccount"]["userId"]}, Listener: ${currentUser["listenerAccount"]["userId"]} (Enabled: ${currentUser["useListener"]}))`);

    if (testUser(currentUser))
        logInfo("Encryption with user works.");
    else
        logFatalErrorAndCrash("Encryption with user is broken!");
}

function initServerListStuff()
{
    serverList = loadObjectOrCreateDefault("serverList", []);
    serverList = ["http://localhost:80"];
    saveObject("serverList", serverList);
    logTxt("Server List:", serverList);
}

async function checkUserStuff()
{
    let pubKey = await getUserPubKey(currentUser["mainAccount"]["userId"]);
    if (pubKey === undefined)
    {
        logError("User not found on server");
        return;
    }
    //logInfo(`User public key: ${pubKey}`);

    if (pubKey != currentUser["mainAccount"]["public-key"])
        logFatalErrorAndCrash("User public key does not match local public key!");
    else
        logInfo("User public key matches local public key!");
}

async function initClientLib()
{
    initUserStuff();
    initServerListStuff();

    await createSockets(serverList, currentUser);
    await checkUserStuff();

    await initMsgSystem();


    //console.log(await accSendRawMessage(currentUser["mainAccount"], currentUser["mainAccount"]["userId"], {text: "yooo"}));
}