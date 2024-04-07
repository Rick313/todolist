/** Simple http server */

import { SqliteDatasource } from "./adapters/Datasource.js";
import { Router as TodoFeatures } from "./features/todo/Routes.js";
import { NotFound, InternalServerError } from "./utils/Http.js";

/** @type {Dependencies} */
const dependencies = {
  config: { port: 3000, hostname: "0.0.0.0", proxy: false },
  datasource: SqliteDatasource("database.sql"),
};

/** @type {Middleware[]} */
const middlewares = [TodoFeatures];

/** @type {Deno.ServeHandler} */
const handler = (request, info) => {
  /** @type {Promise<Response>} */
  const response = middlewares
    .reduce(async (acc, middleware) => {
      const response = await acc;
      const context = { request, response, dependencies };
      const result = await Promise.resolve(middleware(context));
      return result instanceof Response ? result : response;
    }, Promise.resolve(NotFound()))
    .catch((error) => {
      const now = new Date();
      const date = now.toLocaleDateString(undefined, { dateStyle: "short" });
      const time = now.toLocaleTimeString(undefined, { timeStyle: "short" });
      console.log(`[${date} - ${time}][Error]`, error);
      return InternalServerError();
    });

  return response.then((response) => {
    const remote = `${info.remoteAddr.hostname}:${info.remoteAddr.port}`;

    if (dependencies.config.proxy)
      response.headers.append("x-forwarded-for", remote);

    return response;
  });
};

/* -------------------------------- DenoLand -------------------------------- */

const server = Deno.serve({ ...dependencies.config, handler });
server.finished.then(() => console.log("Server closed"));

/* ---------------------------------- Types --------------------------------- */

/**
 * @typedef AppConfig
 * @property {number} port
 * @property {string} hostname
 * @property {boolean} [proxy]
 *
 * @typedef Dependencies
 * @property {AppConfig} config
 * @property {import("./adapters/Datasource.js").Datasource} datasource
 *
 * @typedef Context
 * @property {Request} request
 * @property {Response} response
 * @property {Dependencies} dependencies
 *
 * @typedef {(contet: Context) => Promise<Response | void> | Response | void} Middleware
 *
 * */
