const knex = require('knex')(require('../knexfile').development);
const bcrypt = require("bcrypt");

const createUsersTable = () => {
    return knex.schema
    .createTable('users', (table) => {
        table.bigincrements('user_id').unsigned().notNullable()
        table.string('user_name').notNullable()
        table.string('password').notNullable()
        table.unique('user_name')
    })
    .catch(err => {
        switch (err.errno) {
            case 1050:
                console.log ("users table already exists");
                break;
            default:
                console.log ('create user table error', err.errno);
        }
    })
}

const createTreesTable = () => {
    return knex.schema
    .createTable('trees', (table) => {
        table.bigincrements('tree_id').unsigned().notNullable()
        table.bigInteger('user_id').unsigned().notNullable().references('user_id').inTable('users').onDelete("CASCADE")
        table.string('icon', 1024)
        table.string('color').notNullable()
        table.string('tree_name').notNullable()
        table.string('tree_desc', 2048)
        table.text('branch_order', 'mediumText')
        table.unique(['user_id', 'tree_name']);
    })
    .catch(err => {
        switch (err.errno) {
            case 1050:
                console.log ("trees table already exists");
                break;
            default:
                console.log ('create trees table error', err.errno);
        }
    })
}

const createBranchesTable = () => {
    console.log ("Creating branches table\n\n\n\n");

    return knex.schema
    .createTable('branches', table => {
        table.bigincrements('branch_id').unsigned().notNullable()
        table.bigInteger('tree_id').unsigned().notNullable().references('tree_id').inTable('trees').onDelete("CASCADE")
        table.string('branch_name', 2048)
        table.bigInteger('leaf_id').unsigned()
    })
    .catch(err => {
        switch (err.errno) {
            case 1050:
                console.log ("branches table already exists");
                break;
            default:
                console.log ('create branches table error', err.errno);
        }
    });
}

const createLeavesTable = () => {
    return knex.schema
    .createTable('leaves', table => {
        table.bigincrements('leaf_id').unsigned().notNullable()
        table.bigInteger('branch_id').unsigned().notNullable().references('branch_id').inTable('branches').onDelete("CASCADE")
        table.text('content', 'longtext')
    })
    .catch(err => {
        switch (err.errno) {
            case 1050:
                console.log ("leaves table already exists");
                break;
            default:
                console.log ('create leaves table error', err.errno);
        }
    });
}

const addUser = (userName, password) => {
    return knex('users')
    .insert ({
        user_name: userName,
        password: bcrypt.hashSync(password, 10)
    })
    .catch (err => {
        switch (err.errno) {
            case 1062:
                console.log (`${userName} already exists in users table`);
                break;
            
            default:
                console.log ('addUser error', err);
        }
    })
    
    // const verified = bcrypt.compareSync('Pa$$w0rd', passwordHash);
}

exports.createTables = () => {

    createUsersTable()
    .then(createTreesTable())
    .then(createBranchesTable())
    .then(createLeavesTable())
    .then(() => addUser('admin', "Technologist@33301"))
    .catch (err => {
        console.log ("Create Tables Error:", err);
    })
}
