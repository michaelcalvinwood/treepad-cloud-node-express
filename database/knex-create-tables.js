const knex = require('knex')(require('../knexfile').development);
const bcrypt = require("bcrypt");
const knexCore = require('./knex-core');

const dropTable = table => { 
    console.log (`dropping ${table}`);
    return knex.schema.dropTable(table).catch(err => console.log (`could not drop ${table}`, err))};

const dropAllTables = () => {

    return dropTable('quill')
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
        table.string('email').notNullable()
        table.string('branch_pool', 1024)
        table.unique('user_name')
        table.unique('email')
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
        table.string('module')
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

const createModulesTable = () => {
    return knex.schema
    .createTable('modules', table => {
        table.string('module_name').primary().notNullable()
        table.string('module_icon', 2048).notNullable()
        table.unique('module_name')
    })
    .catch(err => {
        switch (err.errno) {
            case 1050:
                console.log ("modules table already exists");
                break;
            default:
                console.log ('create modules table error', err.errno);
        }
    });
}

const createModuleTable = moduleName => {
    return knex.schema
    .createTable(moduleName, table => {
        table.bigInteger('branch_id').primary().unsigned().notNullable().references('branch_id').inTable('branches').onDelete("CASCADE")
        table.text('content', 'longtext')
    })
    .catch(err => {
        switch (err.errno) {
            case 1050:
                console.log (`${moduleName} table already exists`);
                break;
            default:
                console.log (`create ${moduleName} table error1`, err.errno);
        }
    });
}

const insertUser = (userName, password, email) => {
    return knex('users')
    .insert ({
        user_name: userName,
        password: bcrypt.hashSync(password, 10),
        email: email
    })
}

const addModule = (moduleName, moduleIcon) => {
    console.log(`knex-create-tables.js addModule (${moduleName}, ${moduleIcon})`);
    return knex('modules')
    .insert({
        module_name: moduleName,
        module_icon: moduleIcon
    })
    .then(info => {return createModuleTable(moduleName)})
    .catch(err => {
        console.error(`knex-create-tables.js addModule (${moduleName}, ${moduleIcon})`, err);
    })
}

const addUser = (userName, password, email) => {

    console.log (`knex-create-tables.js addUser ${userName}`);
    let userId;
    let reservedTree = 1;
    let branchPool = [];

    insertUser (userName, password, email)
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

    dropTable('quill')
    .then(info => {return dropTable('videos')})
    .then(info => {return dropTable('chat')})
    .then(info => {return dropTable('post')})
    .then(info => {return dropTable('documents')})
    .then(info => {return dropTable('webpage')})
    .then(info => {return dropTable('image_gallery')})
    .then(info => {return dropTable('modules')})
    .then(info => {return dropTable('branches')})
    .then(info => {return dropTable('trees')})
    .then(info => {return dropTable('users')})
    .then(info => {return createUsersTable()})
    .then(info => {return createTreesTable()})
    .then(info => {return createBranchesTable()})
    .then(info => {return createModulesTable()})
    .then(info => {return knex('users').insert({user_name: 'system', password: 'asdghaskghalhewieufdsvagksajegf', email: 'noemail@noemail.com'})}) // IMPORTANT: Move to .env
    .then(info => {
        // create reserved tree to be assigned to branches in the users' branch pool
        console.log ('reserved tree', info);
        return knexCore.initializeNewTree(info[0], '/svg/tree.svg', 'reserved system tree', 'This tree is used as a reference for branches that are assigned to each user branch pool', '#000000', 1)
    })
    .then(info => {return addModule('quill', '/svg/quill.svg')})
    .then(info => {return addModule('image_gallery', '/svg/image_gallery.svg')})
    .then(info => {return addModule('documents', '/svg/documents.svg')})
    .then(info => {return addModule('chat', '/svg/chat.svg')})
    .then(info => {return addModule('post', '/svg/post.svg')})
    .then(info => {return addModule('webpage', '/svg/webpage.svg')})
    .then(info => {return addModule('videos', '/svg/video.svg')})
    .then(info => {return addUser('admin', "Technologist@33301", 'michaelwood33311@icloud.com')}) // IMPORTANT: Move password to .gitignored .env
    .catch (err => {
        console.log ("Create Tables Error:", err);
    })
}
