import { edenTreaty } from "@elysiajs/eden";
import type { App } from "../../../server/src/index";
import { env } from "@dawncast/env/web";

export const api = edenTreaty<App>(env.VITE_SERVER_URL);
