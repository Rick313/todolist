/** @param {Partial<TodoModel>} [partial] */
function Todo(partial = {}) {
  /** @param {Partial<TodoModel>} value */
  // prettier-ignore
  const construct = (value) => {
    const {
      tid = null,
      content = null,
      createdAt = null,
      completedAt = null,
    } = value;

    /** @param {string} content */
    const setContent = (content) => Todo({ tid, content, createdAt, completedAt });

    /** @param {string} tid */
    const setTid = (tid) => Todo({ tid, content, createdAt, completedAt });

    /** @returns {TodoModel} */
    const toObject = () => ({ tid, content, createdAt, completedAt });

    return { setContent, setTid, toObject };
  };
  return construct(partial);
}

/** @param {string} [content] */
const create = (content = "") =>
  Todo({ tid: crypto.randomUUID(), content, createdAt: Date.now() });

/**
 * @param {Todo} next
 * @param {Todo} previous
 */
const concat = (next, previous) =>
  Todo({ ...previous.toObject(), ...next.toObject() });

export { Todo, create, concat };

/* ---------------------------------- Types --------------------------------- */

/**
 *  @typedef TodoModel
 *  @property {`${string}-${string}-${string}-${string}-${string}`} tid
 *  @property {string} content
 *  @property {number} createdAt
 *  @property {number} completedAt
 */
