export function thingExists(path)
{
    try
    {
        return !!Deno.statSync(path);
    }
    catch (e)
    {
        return false;
    }
}

export function writeFileSync(filename, text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    Deno.writeFileSync(filename, data);
}