const knex = require('knex')(require('../knexfile').development);

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
    return knex('branches')
        .insert ({
            tree_id: treeId
        })
}