
This project depends on ffmpeg for generating video thumbnails.

Install ffmpeg before proceeding forward (e.g. for mac: brew install ffmpeg).

The server also requires a .env file in the root directory with the following variables set:
    SUPERSECRETKEY={key used to sign JWT tokens}\
    ADMINPASSWORD={password for the required administrator account}\
    ADMINEMAIL={admin contact email address}\
    INITIALIZEKEY={api key to be used when creating/resetting database tables}\

The server also requires a knexfile.js in the root directory. Be sure to set the development configuration as this is still an in-development version. An example is as follows:\
    module.exports = {\
        development: {\
        client: "mysql",\
        connection: {\
            host: {hostName},\
            user: {userName},\
            password: {database password},\
            database: "treepad_cloud",\
        }\
        }\
    };\

After setting up the above, run the following to install all remaining dependencies:
    npm install

After dependencies are loaded, you can launch the server with the following command:
    node server.js

The first time that the server is run, you must create and instantiate the database tables by using the /initialize server route:
    {serverUrl}/initialize?key=INITIALIZEKEY // replace INITIALIZEKEY key with the value you set in the .env file

Server setup is now complete.

## Available Scripts

In the project directory, you can run:

### `npm start`
