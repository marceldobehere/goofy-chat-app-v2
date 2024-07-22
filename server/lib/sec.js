import CryptoJS from 'npm:crypto-js@4.1.1';

let hashStringMap = new Map();

export function hashString(str) {

    let res = hashStringMap.get(str);
    if (res)
        return res;

    let hash = CryptoJS.PBKDF2(str, "GoofyHash123", {keySize: 16,iterations: 50000})["words"][0];

    if (hash < 0)
        hash *= -1;

    if (hashStringMap.size > 1_000)
        hashStringMap.clear();

    hashStringMap.set(str, hash);
    return hash;
}

export function makeRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;

    let result = '';
    for (let i = 0; i < length; i++)
        result += characters.charAt(Math.floor(Math.random() * charactersLength));

    return result;
}