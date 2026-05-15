import { edenTreaty } from "@elysiajs/eden";
import type { App } from "../../../server/src/index";

export const api = edenTreaty<App>("http://localhost:3000");
