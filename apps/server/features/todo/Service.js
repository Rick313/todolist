import { Todo } from "./Models.js";

/**
 * @param {Dependencies} dependencies
 * @returns {TodoService}
 * */
function Service(dependencies) {
  /** @type {TodoService} */
  let instance = null;

  const fromRow = ({
    created_at: createdAt,
    completed_at: completedAt,
    ...rest
  }) => Todo({ ...rest, createdAt, completedAt }).toObject();

  /**
   * @param {Dependencies} param0
   * @returns {TodoService}
   * */
  const construct = ({ datasource }) => {
    const list = ({ limit, offset }) => {
      return datasource.exec(async (connection) => {
        const countSql = "select count(tid) from todos";
        const retrieveSql = "select * from todos limit @1 offset @2";
        let [[count], data] = await Promise.all([
          connection.query(countSql),
          connection.query(retrieveSql, [limit, offset]),
        ]);
        data = data.map(fromRow);
        return { count, data };
      });
    };

    const get = async (tid) => {
      const sql = "select * from todos where tid = @1";
      const [todo] = await datasource.exec(sql, [tid]);
      return todo ? fromRow(todo) : null;
    };

    const set = async (todo) => {
      const { tid, content, createdAt, completedAt } = todo.toObject();
      const sql = `
        insert into todo (tid, content, created_at, completed_at)
          values (@1, @2, @3, @4)
        on conflict (tid)  do
          update set content = @2, completed_at = @4
          where tid = @1`;
      await datasource.exec(sql, [tid, content, createdAt, completedAt]);
      return todo.toObject();
    };

    const del = async (tid) => {
      const sql = "delete from todos where tid = @1";
      await datasource.exec(sql, [tid]);
    };

    return { list, get, set, del };
  };
  return instance != null ? instance : (instance = construct(dependencies));
}

export { Service };

/* ---------------------------------- Types --------------------------------- */

/**
 * @typedef {import("./Models.js").TodoModel} TodoModel
 * @typedef {ReturnType<import("./Models.js").Todo>} Todo
 *
 * @typedef Dependencies
 * @property {import("../../adapters/Datasource.js").Datasource} datasource
 *
 * @typedef RetrieveOptions
 * @property {number} limit
 * @property {number} offset
 *
 * @typedef TodoList
 * @property {number} count
 * @property {Array<Todo>} data
 *
 * @typedef TodoService
 * @property {(options: RetrieveOptions) => Promise<TodoList>} list Récupère une liste de todo
 * @property {(tid: string) => Promise<Todo | null>} get Récupère une todo par son tid
 * @property {(todo: Todo) => Promise<TodoModel>} set Insert ou Update une todo
 * @property {(tid: string) => Promise<void>} del Supprime une todo
 *
 * */
