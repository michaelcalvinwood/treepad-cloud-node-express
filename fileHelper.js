exports.getFile = (req, res) => {
    console.log('knexCommands.js getFile');

    const {userId, fileName} = req.params;

    const path = __dirname + '/assets/' + userId + '/' + fileName;

    console.log('knexCommands.js getFile', 'path', path)

    //TODO add security such as a session key to protect assets

    // const authUserId = req.decode.userid;

    // console.log('knexCommands.js getFile comparing user ids', `${userId}:${typeof userId}`, `${authUserId}:${typeof authUserId}`);

    // if (userId !== authUserId) return res.status(401).send('unauthorized');

    res.status(200).sendFile(path);
}