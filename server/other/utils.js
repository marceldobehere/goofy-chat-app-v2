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