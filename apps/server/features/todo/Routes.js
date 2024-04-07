import {
  ApiResponseItem,
  ApiResponseList,
  ContentTooLarge,
  MethodNotAllowed,
  NoContent,
  NotAcceptable,
  NotFound,
} from "../../utils/Http.js";
import { Service as TodoService } from "./Service.js";

/* -------------------------------- DenoLand -------------------------------- */

/**
 * @param {import("../../main.js").Context} arg0
 * @returns {Promise<Response>}
 * */
function Router({ request, response, dependencies }) {
  const method = request.method;
  const { searchParams, pathname } = new URL(request.url);

  // Check body length
  const length = Number(request.headers.get("content-length")) || 0;
  if (length > 1_000_000 * 8) return ContentTooLarge("Max size 8mb");

  // prettier-ignore
  if (/\/api\/todo\/?/i.test(pathname))
    if (method == "OPTION")    return handleOptions("GET", "POST");
    else if (method == "GET")  return getTodos(dependencies, searchParams);
    else if (method == "POST") return postTodo(dependencies, getBody(request));
    else                       return MethodNotAllowed();

  // prettier-ignore
  if (/\/api\/todo\/(.*)\/?/i.test(pathname)) {
    const tid = pathname.split("/").at(2);
    if (method == "OPTION")      return handleOptions("GET", "PATCH", "DELETE");
    else if (method == "GET")    return getTodo(dependencies, tid);
    else if (method == "DELETE") return deleteTodo(dependencies, tid);
    else if (method == "PATCH")  return updateTodo(dependencies, tid, getBody(request));
    else                         return MethodNotAllowed();
  }

  return Promise.resolve(response);
}

export { Router };

/* -------------------------------- Internal -------------------------------- */

/**
 * Handler OPTION /todo/*
 * @param  {Array<string>} methods
 * @returns {Response}
 */
function handleOptions(...methods) {
  const response = NoContent();
  response.headers.append({ allow: methods.join(", ") });
  return response;
}

/**
 * Handler POST /todo
 * @private
 * @param {import("../../main.js").Dependencies} dependencies
 * @param {URLSearchParams} params
 * @returns {Promise<Response>}
 */
async function getTodos(dependencies, params) {
  const resource = "todo";
  const limit = Number(params.get("limit")) || 100;
  const offset = Number(params.get("offset")) || 0;
  const service = TodoService(dependencies);
  const data = await service.list({ limit, offset });
  return ApiResponseList(200, { ...data, resource });
}

/**
 * Handler POST /todo
 * @private
 * @param {import("../../main.js").Dependencies} dependencies
 * @param {Promise<object>} body
 * @returns {Promise<Response>}
 */
async function postTodo(dependencies, body) {
  try {
    const resource = "todo";
    const todo = await body;
    // Validate body
    const service = TodoService(dependencies);
    const data = await service.set(todo);
    return ApiResponseItem(201, { data, resource });
  } catch (error) {
    if (error.code == CONTENT_NOT_ACCEPTABLE)
      return NotAcceptable(error.message);
    throw error;
  }
}

/**
 * Handler GET /todo/{tid}
 * @private
 * @param {import("../../main.js").Dependencies} dependencies
 * @param {string} tid
 * @returns {Promise<Response>}
 */
async function getTodo(dependencies, tid) {
  const resource = "todo";
  const service = TodoService(dependencies);
  const data = await service.get(tid);
  if (data == null) return NotFound();
  return ApiResponseItem(201, { data, resource });
}

/**
 * Handler DELETE /todo/{tid}
 * @private
 * @param {import("../../main.js").Dependencies} dependencies
 * @param {string} tid
 * @returns {Promise<Response>}
 */
async function deleteTodo(dependencies, tid) {
  const service = TodoService(dependencies);
  await service.del(tid);
  return NoContent();
}

/**
 * Handler PATCH /todo/{tid}
 * @private
 * @param {import("../../main.js").Dependencies} dependencies
 * @param {string} tid
 * @param {Promise<object>} body
 * @returns {Promise<Response>}
 */
async function updateTodo(dependencies, tid, body) {
  try {
    const todo = await body;
    // Validate body
    const record = todo.setTid(tid);
    const service = TodoService(dependencies);
    await service.set(record);
    return NoContent();
  } catch (error) {
    return handleError(error);
  }
}

// Simple "enum"
const { 0: CONTENT_NOT_ACCEPTABLE } = Array.of(1);

/**
 * Parse request body
 * Accept json & urlencoded
 * @param {Request} request
 * @returns {Promise<object>}
 */
function getBody(request) {
  const decode = (str) =>
    Object.fromEntries(new URLSearchParams(str).entries());

  const type = request.headers.get("content-type");
  const json = /^application\/json/i;
  const urlencoded = /^application\/x-www-form-urlencoded/i;
  return new Promise((resolve, reject) => {
    if (json.test(type)) return request.json().then(resolve);
    if (urlencoded.test(type)) return request.text().then(decode).then(resolve);

    const error = new Error("Accept json or form-urlencoded");
    error.code = CONTENT_NOT_ACCEPTABLE;
    reject(error);
  });
}

/**
 * @throws
 * @param {any} error
 * @returns {Response}
 */
function handleError(error) {
  if (error.code == CONTENT_NOT_ACCEPTABLE) return NotAcceptable(error.message);
  throw error;
}
