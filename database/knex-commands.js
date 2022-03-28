// Useful Knex Cheat Sheets:

//     https://devhints.io/knex
//     https://dev.to/hoanganhlam/knex-cheat-sheet-79o
const knex = require('knex')(require('../knexfile').development);
const bcrypt = require("bcrypt");



/*
    Branches Code:
        i: id
        p: parent
        c: child (first child)
        b: before (sibling before)
        a: after (sibling after)
        s: status (0 = closed, 1 = open) i.e. closed = do not display children; open = display children
        l: level (1-5) for indentation
*/

/* addTree occurs in three steps:
    1) A new tree is created in trees
    2) A new branch is created in branches
    3) The trees.branch_order is updated with initial state of the new branch
*/

const initializeNewTree = (userId, icon, treeName, treeDesc, color) => {
    return knex('trees')
    .insert ({
        user_id: Number(userId),
        icon: icon,
        tree_name: treeName,
        tree_desc: treeDesc,
        color: color,
        branch_order: JSON.stringify([])
    });
}

const createNewBranch = treeId => {
    console.log(`created Tree: ${treeId}`);
    return knex('branches')
        .insert ({
            tree_id: info
        })
}

const updateNewTreeWithInitialBranch = info => {
    const branchId = info[0];
    console.log('branch added', branchId);
    return knex('trees')
    .update ({
        branch_order: JSON.stringify([{i: branchId, p: 0, c: 0, b:0, a:0, s:0, l:1}])
    })
    .where ({
        tree_id: treeId
    })
}

exports.addTree = (req, res) => {
    let {userId, icon, treeName, treeDesc, color} = req.body;

    if (!userId || !icon || !treeName) {
        return res.status(400).json({status: 'error', message: 'missing input(s)'}); 
    }

    if (!treeDesc) treeDesc = '';

    if (!color) color = '#000000';

    initializeNewTree (userId, icon, treeName, treeDesc, color)
    .then(info => createNewBranch(info))   
    .then(info => updateNewTreeWithInitialBranch(info))
    .then(info => {
        res.status(200).json({status: "success"});
    })
    .catch(err => {
        console.log (`create new tree error`, err);
        res.status(401).json({status: "error", message: err});
    })
}

exports.getTrees = (req, res) => {
    const {userId} = req.params;

    if (!userId) {
        return res.status(401).json({status: 'error', message: 'missing userId'}); 
    }

    knex('trees')
    .join('users', {'trees.user_id': 'users.user_id'})
    .select('tree_id', 'users.user_name', 'trees.user_id', 'icon', 'tree_name', 'tree_desc')
    .where({"trees.user_id": userId})
    .then (data => res.status(200).json({status: 'success', message: data}))
    .catch (err => res.status(401).json({status: 'error', message: err}));
}

exports.getBranches = (req, res) => {
    const {treeId} = req.params;

    if (!treeId) {
        return res.status(401).json({status: 'error', message: 'missing treeId'}); 
    }

    knex('trees')
    .select('branch_order', 'tree_id')
    .where({"trees.tree_id": treeId})
    .then (data => res.status(200).json({status: 'success', message: data}))
    .catch (err => res.status(401).json({status: 'error', message: err}));

}