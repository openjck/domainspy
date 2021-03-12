import { parse } from "https://deno.land/std@0.90.0/encoding/toml.ts";

const config = parse(await Deno.readTextFile("config.toml"));
console.log(config);
