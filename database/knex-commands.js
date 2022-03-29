// Useful Knex Cheat Sheets:

//     https://devhints.io/knex
//     https://dev.to/hoanganhlam/knex-cheat-sheet-79o
const knex = require('knex')(require('../knexfile').development);
const bcrypt = require("bcrypt");




/* addTree occurs in three steps:
    1) A new tree is created in trees
    2) A new branch is created in branches
    3) The trees.branch_order is updated with initial state of the new branch
*/

exports.initializeNewTree = (userId, icon, treeName, treeDesc, color) => {
    return knex('trees')
    .insert({
        user_id: Number(userId),
        icon: icon,
        tree_name: treeName,
        tree_desc: treeDesc,
        color: color,
        branch_order: JSON.stringify([])
    })
}

exports.createNewBranch = treeId => {
    console.log(`creating new branch for tree ${treeId}`);
    return knex('branches')
        .insert ({
            tree_id: treeId
        })
}

const updateNewTreeWithInitialBranch = (treeId, branchId) => {
    console.log('branch added', branchId);
    return knex('trees')
    .update ({
        branch_order: JSON.stringify([`${branchId}:1`])
    })
    .where ({
        tree_id: treeId
    })
}

const createNewLeaf = branchId => {
    return knex('leaves')
    .insert({
        branch_id: branchId
    })
}

const updateNewBranchWithInitialLeaf = (branchId, leafId) => {
    return knex('branches')
    .update({
        leaf_id: leafId
    })
    .where({
        branch_id: branchId
    })
}

exports.addTree = (req, res) => {
    console.log("addTree", req.body);

    let {userId, icon, treeName, treeDesc, color} = req.body;

    if (!userId || !icon || !treeName) {
        return res.status(400).json({status: 'error', message: 'missing input(s)'}); 
    }

    if (!treeDesc) treeDesc = '';

    if (!color) color = '#000000';

    let treeId;
    let branchId;
    let leafId;

    initializeNewTree (userId, icon, treeName, treeDesc, color)
    .then(info => {
        treeId = info;
        return createNewBranch(treeId)
    })   
    .then(info => {
        branchId = info[0];
        return updateNewTreeWithInitialBranch(treeId, branchId)
    })
    .then(info => {
        return createNewLeaf(branchId)
    })
    .then(info => {
        leafId = info[0];
        return updateNewBranchWithInitialLeaf(branchId, leafId)
    })
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