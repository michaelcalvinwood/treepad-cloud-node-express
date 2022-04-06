const knex = require('knex')(require('../knexfile').development);
const bcrypt = require("bcrypt");
const knexCore = require('./knex-core');
require('dotenv').config();
const path = require("path");
const fs = require('fs');

const dropTable = table => { 
    return knex.schema.dropTable(table).catch(err => console.error (`could not drop ${table}`, err))};

const dropAllTables = () => {

    return dropTable('quill')
    .then (dropTable('branches'))
    .then (dropTable('trees'))
    .then (dropTable('users'))
    .catch(err => {
        console.error ("error dropping tables", err);
    })
}

const createUsersTable = () => {
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
                break;
            default:
                console.error ('create user table error', err);
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
                break;
            default:
                console.error ('create trees table error', err.errno);
        }
    })
}

const createBranchesTable = () => {
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
                break;
            default:
                console.error ('create branches table error', err.errno);
        }
    });
}

const createModulesTable = () => {
    return knex.schema
    .createTable('modules', table => {
        table.bigincrements('id').primary()
        table.string('module_name').notNullable()
        table.string('module_icon', 2048).notNullable()
        table.unique('module_name')
    })
    .catch(err => {
        switch (err.errno) {
            case 1050:
                break;
            default:
                console.error ('create modules table error', err.errno);
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
                break;
            default:
                console.error (`create ${moduleName} table error1`, err.errno);
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
    let userId;
    let reservedTree = 1;
    let branchPool = [];

    insertUser (userName, password, email)
    .then(info => {
        userId = info[0];
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
    })
    .catch (err => {
        switch (err.errno) {
            case 1062:
                break;
            
            default:
                console.error ('addUser error', err);
        }
    })

}

const createReservedBranch = treeId => {
    return knex('branches')
    .insert ({
        tree_id: treeId
    })
}

exports.createTables = (req, res) => {
    if (!req.query.key) {
        return res.status(401).json({message: 'missing key'});
    }

    const {key} = req.query;

    if (key !== process.env.INITIALIZEKEY) {
        return res.status(401).json({message: 'invalid key'});
    }

    // directory path
    const dir = path.resolve('assets/');

    // delete directory recursively
    fs.rm(dir, { recursive: true }, (err) => { });

    let reservedTree = '';
    let branchPool = [];

    dropTable('notes')
    .then(info => {return dropTable('videos')})
    .then(info => {return dropTable('chat')})
    .then(info => {return dropTable('post')})
    .then(info => {return dropTable('documents')})
    .then(info => {return dropTable('webpage')})
    .then(info => {return dropTable('images')})
    .then(info => {return dropTable('modules')})
    .then(info => {return dropTable('branches')})
    .then(info => {return dropTable('trees')})
    .then(info => {return dropTable('users')})
    .then(info => {return createUsersTable()})
    .then(info => {return createTreesTable()})
    .then(info => {return createBranchesTable()})
    .then(info => {return createModulesTable()})
    .then(info => {return knex('users').insert({user_name: 'system', password: 'asdghaskghalhewieufdsvagksajegf', email: 'noemail@noemail.com'})}) // Note: Hackers cannot use this info to bypass because a password hash will be applied when logging in. In other words, this value is fake hash, not a fake password. Thus, it is not in the .env file.
    .then(info => {
        // create reserved tree to be assigned to branches in the users' branch pool
        return knexCore.initializeNewTree(info[0], '/svg/tree.svg', 'reserved system tree', 'This tree is used as a reference for branches that are assigned to each user branch pool', '#000000', 1)
    })
    .then(info => {return addModule('notes', '/svg/quill.svg')})
    .then(info => {return addModule('images', '/svg/image_gallery.svg')})
    .then(info => {return addModule('videos', '/svg/video.svg')})
    .then(info => {return addModule('documents', '/svg/documents.svg')})
    .then(info => {return addModule('chat', '/svg/chat.svg')})
    .then(info => {return addModule('post', '/svg/post.svg')})
    .then(info => {return addModule('webpage', '/svg/webpage.svg')})
    .then(info => {return addUser('admin', process.env.ADMINPASSWORD, process.env.ADMINEMAIL)})
    .then(info => {
        res.status(200).json({message: 'tables created'});
    })
    .catch (err => {
        res.status(500).json({error: err});
    })
}
