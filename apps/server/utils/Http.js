const NotFound = () => new Response("Not found", { status: 404 });

const MethodNotAllowed = () =>
  new Response("Method not allowed", { status: 405 });

/** @param {string} msg  */
const ContentTooLarge = (msg) =>
  new Response(msg || "Content too large", { status: 413 });

/** @param {string} msg  */
const BadRequest = (msg) =>
  new Response(msg || "Content too large", { status: 400 });

/** @param {string} msg  */
const NotAcceptable = (msg) =>
  new Response(msg || "Not acceptable", { status: 406 });

const InternalServerError = () =>
  new Response("Internal server error", { status: 500 });

const NoContent = () => new Response("", { status: 204 });

/**
 * Clear undefined
 * @param {object} data
 * @param {object} schema
 * @returns {object}
 */
function clear(data, schema) {
  return Object.entries(data).reduce(
    (acc, [k, v]) => (v != undefined && v in acc ? { ...acc, [k]: v } : acc),
    schema,
  );
}

/**
 * @param {number} status
 * @param {ResponseList} body
 */
const ApiResponseList = (status, body) => {
  // prettier-ignore
  const schema = { resource: null, data: [], next: null, previous: null, version: 1, count: null };
  body = clear(body, schema);
  const headers = { "content-type": "application/json" };
  return new Response(JSON.stringify(body), { status, headers });
};

/**
 * @param {number} status
 * @param {ResponseItem} body
 */
const ApiResponseItem = (status, body) => {
  const schema = { resource: null, data: null, version: 1 };
  body = clear(body, schema);
  const headers = { "content-type": "application/json" };
  return new Response(JSON.stringify(body), { status, headers });
};

export {
  NotFound,
  NoContent,
  NotAcceptable,
  MethodNotAllowed,
  InternalServerError,
  ContentTooLarge,
  BadRequest,
  ApiResponseList,
  ApiResponseItem,
};

/* ---------------------------------- Types --------------------------------- */

/**
 * @typedef ResponseList<T>
 * @property {resource} string
 * @property {Array<T>} data
 * @property {string|null} next
 * @property {string|null} previous
 * @property {number} [version]
 *
 * @typedef ResponseItem<T>
 * @property {T} data
 * @property {resource} string
 * @property {number} [version]
 */
