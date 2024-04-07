import { DB } from "https://deno.land/x/sqlite/mod.ts";

/**
 * @returns {Datasource}
 */
function SqliteDatasource(dbname = "default.sql") {
  /**
   * @param {DB} database
   * @returns {Connection}
   */
  function Connection(database) {
    const open = () => {
      if (database == undefined || database.isClosed) database = new DB(dbname);
      return Connection(database);
    };

    const close = () => void database.isClosed && database.close();

    const transaction = (callable) =>
      database.transaction(async () => {
        try {
          await callable(Connection(database));
        } catch (error) {
          close();
          throw error;
        }
      });

    const query = (sql, params) => {
      try {
        const rows =
          params == undefined
            ? database.query(sql)
            : database.query(sql, params);
        return Promise.resolve(rows);
      } catch (error) {
        close();
        throw error;
      }
    };

    const execute = (sql) => {
      try {
        database.execute(sql);
        return Promise.resolve();
      } catch (error) {
        close();
        throw error;
      }
    };

    if (database == undefined) open();

    return { execute, query, transaction, close, open };
  }

  const exec = (queryOrCallable, params) => {
    if (typeof queryOrCallable == "function")
      return Connection().transaction(queryOrCallable);
    return params == undefined
      ? Connection().query(queryOrCallable)
      : Connection().query(queryOrCallable, params);
  };

  const connection = () => Connection();

  return { exec, connection };
}

export { SqliteDatasource };

/**
 * @typedef Connection
 * @property {(sql: any) => Promise<void>} execute
 * @property {(sql: any, params: any) => Promise<any[]} query
 * @property {(callable: any) => Promise<void>} transaction
 *
 * @typedef {{
 *  <T>(query: string) => Promise<T>;
 *  <T>(query: string, params: Array<any>) => Promise<T>;
 *  <T>(callable: (connection: Connection) => Promise<T | void> | void) => Promise<T | void>
 * }} SqlQuery
 *
 * @typedef Datasource
 * @property {SqlQuery} exec
 *
 */
