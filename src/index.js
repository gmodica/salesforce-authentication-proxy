require('dotenv').config();

const express = require('express');
const app = express();

// basic authentication
app.use((req, res, next) => {
    // -----------------------------------------------------------------------
    // authentication middleware
    if (!req.originalUrl.startsWith('/api')) return next();

    const auth = {
        login: process.env.SECURITY_USERNAME,
        password: process.env.SECURITY_PASSWORD,
		apiKey: process.env.SECURITY_API_KEY
    };

    // parse login and password from headers
    const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
    const [login, password] = new Buffer.from(b64auth, 'base64').toString().split(':')

    // Verify login and password are set and correct
    if (login && password && login === auth.login && password === auth.password) {
        const apiKey = (req.headers["x-api-key"] || '');
		if(apiKey && apiKey === auth.apiKey) {
			return next();
		}
    }

    // Access denied...
    res.set('WWW-Authenticate', `Basic realm="${process.env.SECURITY_REALM}"`) // change this
    res.status(401).send('Authentication required.') // custom message

    // -----------------------------------------------------------------------
});

var routes = require('./api/routes/apiRoutes'); //importing route
routes(app);

app.listen(process.env.PORT, () => console.log(`app listening on port ${process.env.PORT}!`));