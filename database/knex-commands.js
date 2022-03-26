// Useful Knex Cheat Sheets:

//     https://devhints.io/knex
//     https://dev.to/hoanganhlam/knex-cheat-sheet-79o

const knex = require('knex')(require('../knexfile').development);

exports.createTables = () => {
    // knex.schema
    // .createTable('user', (table) => {
    //     table.increments('id')
    //     table.string('name')
    //     table.integer('age')
    // })
    // .createTable('user2', (table) => {
    //     table.increments('id')
    //     table.string('name')
    //     table.integer('age')
    // })
    // .then(() => console.log('user table created'));
}
