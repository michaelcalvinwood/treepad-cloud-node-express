exports.getFile = (req, res) => {
    const {userId, fileName} = req.params;

    const path = __dirname + '/assets/' + userId + '/' + fileName;

    //TODO add security such as a session key to protect assets

    res.status(200).sendFile(path);
}