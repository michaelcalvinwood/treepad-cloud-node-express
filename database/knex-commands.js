const knex = require('knex')(require('../knexfile').development);
const knexCore = require('./knex-core');
const ThumbnailGenerator = require('@openquantum/video-thumbnail-generator-for-cloud-functions').default;
const reservedTreeId = 1;
const path = require("path");

const updateNewTreeWithInitialBranch = (treeId, branchId) => {
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
    let {userId, icon, treeName, treeDesc, color} = req.body;

    if (!userId || !icon || !treeName) {
        return res.status(400).json({status: 'error', message: 'missing input(s)'}); 
    }

    if (!treeDesc) treeDesc = '';

    if (!color) color = '#000000';

    let treeId;
    let branchId;
    let leafId;

    knexCore.initializeNewTree (userId, icon, treeName, treeDesc, color)
    .then(info => {
        treeId = info;
        return knexCore.createNewBranch(treeId)
    })   
    .then(info => {
        branchId = info[0];
        return updateNewTreeWithInitialBranch(treeId, branchId)
    })
    .then(info => {
        res.status(200).json({status: "success"});
    })
    .catch(err => {
        res.status(401).json({status: "error", message: err});
    })
}

exports.updateBranchPool = (req, res) => {
    let {userId, branchId, treeId} = req.params;

    if (!userId) {
        return res.status(401).json({status: 'error', message: 'missing userId'}); 
    }

    if (!branchId) {
        return res.status(401).json({status: 'error', message: 'missing branchId'}); 
    }

    if (!treeId) {
        return res.status(401).json({status: 'error', message: 'missing treeId'}); 
    }

    let newBranch;

    knexCore.createNewBranch(reservedTreeId)
    .then(info => {
        newBranch = info[0];
        return knex('users')
        .select('branch_pool')
        .where({
            user_id: userId
        })
    })
    .then(info => {
        let branchPool = JSON.parse(info[0].branch_pool)
        branchId = Number(branchId);
        branchPool = branchPool.map(branch => {
            return branch !== branchId ? branch : newBranch
        })
        return knex('users')
        .update ({
            branch_pool: JSON.stringify(branchPool)
        })
        .where({
            user_id : userId
        })
    })
    .then(info => {
        return knex('branches')
        .update({
            tree_id: Number(treeId)
        })
        .where({
            branch_id: branchId
        })
    })
    .then(info => {
        res.status(200).json({userId: userId, branchId: newBranch});
    })
    .catch(err => {
        console.error(`knex-commands.js updateBranchPool`, err);
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

exports.getActiveModule = (req, res) => {
    const { branchId } = req.params;

    if (!branchId) {
        return res.status(401).json({status: 'error', message: 'missing branchId'}); 
    }

   
    knex('branches')
    .select('module')
    .where({branch_id: Number(branchId)})
    .then(info=>{
        const moduleName = info[0].module;

        return knex('modules')
        .select('module_icon')
        .where({module_name: moduleName})
        .then(info => {
            const moduleIcon = info[0].module_icon;

            res.status(200).json({moduleName: moduleName, moduleIcon: moduleIcon});
        })
        .catch(err => {
            console.error('knex-commands.js getActiveModule axio modules', err)
            res.status(404).json(err);
        })
       
    })
    .catch(err => {
        res.status(401).json(err);
    })
}

exports.getActiveModuleContent = (req, res) => {
    const { moduleName, branchId } = req.params;

    if (!moduleName || !branchId) {
        return res.status(401).json({status: 'error', message: 'missing branchId'}); 
    }

    knex(moduleName)
    .select('content')
    .where({branch_id: Number(branchId)})
    .then(info => {
        const content = info[0].content;

        res.status(200).json({content: content});
    })
    .catch(err => {
        console.error('knex-commands.js getActiveModuleContent axios no content', err)
        res.status(200).json({content: JSON.stringify([])});
    })
    
   
}

exports.getBranchPool = (req, res) => {
    const {userId} = req.params;

    if (!userId) {
        return res.status(401).json({status: 'error', message: 'missing userId'}); 
    }

    knex('users')
    .select('user_id', 'branch_pool')
    .where({"user_id": userId})
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

exports.getBranchName = (req, res) => {
    const {branchId} = req.params;

    if (!branchId) {
        return res.status(401).json({status: 'error', message: 'missing branchId'}); 
    }

    knex('branches')
    .select('branch_name', 'branch_id')
    .where({"branch_id": Number(branchId)})
    .then (data => res.status(200).json({status: 'success', message: data}))
    .catch (err => res.status(401).json({status: 'error', message: err}));
}

exports.saveBranchOrder = (req, res) => {
    const {treeId} = req.params;

    if (!treeId) {
        return res.status(401).json({status: 'error', message: 'missing treeId'}); 
    }

    const {branchOrder, branchNames} = req.body;

    knex('trees')
    .update({branch_order: branchOrder})
    .where({"trees.tree_id": treeId})
    .then (data => res.status(200).json({status: 'success', message: data}))
    .catch (err => res.status(401).json({status: 'error', message: err}));
}

exports.saveBranchName = (req, res) => {
    const {branchId, branchName} = req.body;

    if (!branchId || !branchName) {
        return res.status(401).json({status: 'error', message: 'missing data'}); 
    }

    const {branchOrder, branchNames} = req.body;

    knex('branches')
    .update({branch_name: branchName})
    .where({"branch_id": branchId})
    .then (data => res.status(200).json({status: 'success', message: data}))
    .catch (err => res.status(401).json({status: 'error', message: err}));
}

exports.saveModuleContent = (req, res) => {
    const {moduleName, branchId} = req.params;

    if (!moduleName || !branchId) {
        return res.status(401).json({status: 'error', message: 'missing params'}); 
    }

    const {content} = req.body;

    if (!content) {
        return res.status(401).json({status: 'error', message: 'missing content'}); 
    }

    knex(moduleName)
    .update({content: content})
    .where({branch_id: branchId})
    .then(info => {
        if (info > 0) {
            res.status(200).json({status: 'success'})
            return;
        }

        knex(moduleName)
        .insert({content: content, branch_id: branchId})
        .then(info => {
            res.status(201).json({status: 'success'})
            return;
        })
        .catch(err => {
            console.error(`knex-commands.js saveModuleContent`, err)
            res.status(401).json({status: 'error', error: err})
        })

    })
    .catch(err => {
        // if module_id 
        console.error(`knex-commands.js saveModuleContent`, err)
        res.status(401).json({status: 'error', error: err})
    })
}

getFileExtension = fileName => {
    if (!fileName.length) return false;

    const parts = fileName.split('.');

    if (parts.length === 1) return false;

    // abuse prevention
    if (fileName.indexOf('.ThUmBnAiL.jpg') !== -1) return false;
            
    return parts[parts.length - 1];
}

getThumbnailName = (fileName, extension) => {
    switch (extension.toLowerCase()) {
        case 'gif':
        case 'png':
        case 'jpeg':
        case 'jpg':
            return false;
        default:
            return `${fileName}.ThUmBnAiL.jpg`;
    }
}

exports.uploadAssets = (req, res) => {
    req.thumbnails.forEach(fileName => {
        let extension = getFileExtension(fileName);
        if (extension) {
            let thumbnail = getThumbnailName(fileName, extension);
            if (thumbnail) {
                const fullFileName = path.resolve(`assets/${req.decode.userid}/${fileName}`);
                const thePath = path.resolve(`assets/${req.decode.userid}/`);
                const tg = new ThumbnailGenerator({
                    sourcePath: fullFileName,
                    thumbnailPath: thePath,
                    tmpDir: thePath //only required if you can't write to /tmp/ and you need to generate gifs
                  });

                tg.generateOneByPercent(90)
                .then(()  => {})
                .catch(err => console.error(err));
            }
        }
    });
    
    // TODO: set a counter for the thumbnails and increment the counter in the .then OR setup as recursive Promise chain.
    //      When all thumbnails are processed then return

    setTimeout(() => {
        res.status(200).send('success');
    }, 2500);
    
}

exports.getAllModules = (req, res) => {
    knex('modules')
    .then(info => {
        res.status(200).json(info);
    })
    .catch(err => {
        res.status(400).json(err)
    })
}

exports.setActiveModule = (req, res) => {
    let {moduleName} = req.body;
    const {branchId} = req.params;

    if (moduleName === 'null') moduleName = null;
    
    knex('branches')
    .update({module: moduleName})
    .where({branch_id: branchId})
    .then(info => {
        res.status(200).send('success')
    })
    .catch(err => {
        res.status(400).json(err);
    })
}