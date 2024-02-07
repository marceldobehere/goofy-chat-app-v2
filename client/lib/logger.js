let logEnabled = true;

let logTxtEnabled = true;
let logInfoEnabled = true;
let logWarnEnabled = true;
let logErrorEnabled = true;

let logAddTimeStamp = false;

function getWithTimeStampIfNeeded(txt)
{
    if (logAddTimeStamp)
        return `[${new Date().toLocaleTimeString()}] ${txt}`;
    return txt;
}

function toStr(thing)
{
    if (typeof thing === "string")
        return thing;
    return JSON.stringify(thing);
}

function toOneStr(arr)
{
    let tempStr = "";
    for (let str of arr)
        tempStr += toStr(str) + " ";
    return tempStr;
}

function _logExtra(level, arr)
{
    if (!logEnabled)
        return;

    let txt = toOneStr(arr);
    if (level === undefined || level === "")
        console.log(getWithTimeStampIfNeeded(`${toStr(txt)}`));
    else
        console.log(getWithTimeStampIfNeeded(`${level}: ${toStr(txt)}`));
}

function logTxt(...arr)
{
    if (logTxtEnabled)
        _logExtra("", arr);
}

function logInfo(...arr)
{
    if (logInfoEnabled)
        _logExtra("INFO", arr);
}

function logWarn(...arr)
{
    if (logWarnEnabled)
        _logExtra("WARN", arr);
}

function logError(...arr)
{
    if (logErrorEnabled)
        _logExtra("ERROR", arr);
}