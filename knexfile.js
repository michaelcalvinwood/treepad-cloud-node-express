// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
 module.exports = {
  development: {
    client: "mysql",
    connection: {
        host: "tocglobal.c02y7n6dq7og.us-east-1.rds.amazonaws.com",
        user: "admin",
        password: "1Kl0ruSxfjbNPCpeosoI",
        database: "treepad_cloud",
    }
  }
};
