const knex = require('knex')(require('../knexfile').development);
const bcrypt = require("bcrypt");
const knexCore = require('./knex-core');

const dropTable = table => { 
    console.log (`dropping ${table}`);
    return knex.schema.dropTable(table).catch(err => console.log (`could not drop ${table}`))};

const dropAllTables = () => {

    return dropTable('leaves')
    .then (dropTable('branches'))
    .then (dropTable('trees'))
    .then (dropTable('users'))
    .catch(err => {
        console.log ("error dropping tables", err);
    })
}

const createUsersTable = () => {
    console.log ("Creating users table...");
    return knex.schema
    .createTable('users', (table) => {
        table.bigincrements('user_id').unsigned().notNullable()
        table.string('user_name').notNullable()
        table.string('password').notNullable()
        table.string('branch_pool', 1024)
        table.unique('user_name')
    })
    .catch(err => {
        switch (err.errno) {
            case 1050:
                console.log ("users table already exists");
                break;
            default:
                console.log ('create user table error', err);
        }
    })
}

const createTreesTable = () => {
    console.log (`creating tree table`)
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
        table.string('branch_name', 2048),
        table.string('active_module').notNullable().default('leaf')
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
        table.bigInteger('leaf_id').primary().unsigned().notNullable().references('branch_id').inTable('branches').onDelete("CASCADE")
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

const insertUser = (userName, password) => {
    return knex('users')
    .insert ({
        user_name: userName,
        password: bcrypt.hashSync(password, 10)
    })
}

const addUser = (userName, password) => {

    console.log (`adding ${userName}`);
    let userId;
    let reservedTree = 1;
    let branchPool = [];

    insertUser (userName, password)
    .then(info => {
        userId = info[0];
        console.log(`User id from ${userName} is ${userId}`)
        return knexCore.createNewBranch(reservedTree)
    })
    .then(info => {
        branchPool.push(info[0])
        return knexCore.createNewBranch(reservedTree)
    })
    .then(info => {
        branchPool.push(info[0])
        return knexCore.createNewBranch(reservedTree)
    })
    .then(info => {
        branchPool.push(info[0]);
        console.log('branchPool', branchPool)
        return info[0]
    })
    .then(info => {
        return knex('users')
        .update({
            branch_pool: JSON.stringify(branchPool)
        })
        .where({
            user_id: userId
        })
    })
    .then(info => {
        console.log(`User ${userName} has been added.`);
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

const createReservedBranch = treeId => {
    return knex('branches')
    .insert ({
        tree_id: treeId
    })
}

exports.createTables = () => {

    let reservedTree = '';
    let branchPool = [];

    dropTable('leaves')
    .then(info => {return dropTable('branches')})
    .then(info => {return dropTable('trees')})
    .then(info => {return dropTable('users')})
    .then(info => {return createUsersTable()})
    .then(info => {return createTreesTable()})
    .then(info => {return createBranchesTable()})
    .then(info => {return createLeavesTable()})
    .then(info => {return knex('users').insert({user_name: 'system', password: 'asdghaskghalhewieufdsvagksajegf'})})
    .then(info => {
        // create reserved tree to be assigned to branches in the users' branch pool
        console.log ('reserved tree', info);
        return knexCore.initializeNewTree(info[0], '/svg/tree.svg', 'reserved system tree', 'This tree is used as a reference for branches that are assigned to each user branch pool', '#000000', 1)
    })
    .then(info => {return addUser('admin', "Technologist@33301")}) // IMPORTANT: Move password to .gitignored .env
    .catch (err => {
        console.log ("Create Tables Error:", err);
    })
}
