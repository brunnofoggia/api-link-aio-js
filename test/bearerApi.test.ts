import debug_ from 'debug';
const debug = debug_('test:api');

import { HttpStatusCode } from 'axios';

import { openRoute, setRoutes as _setRoutes } from './publicApi.test';

export const port = 1990;
export const user = 'someuser';
export const pass = 'somepass';

let currentToken = '';

export const getDateTimeToken = () => {
    if (!currentToken) {
        const date = new Date();
        currentToken = `testtoken_${date.getDate()}_${date.getHours()}_${date.getMinutes()}`;
    }
    return currentToken;
};

const auth = (req, res) => {
    if (req.body.username === user && req.body.password === pass) {
        return res.json({ token: getDateTimeToken() });
    }
    return res.status(HttpStatusCode.Forbidden).json({ message: 'Forbidden' });
};

export const authorize = (req, res, next) => {
    if (req.headers.authorization.split(' ')[1] !== getDateTimeToken()) {
        return res.status(HttpStatusCode.Unauthorized).json({ message: 'Unauthorized' });
    }
    next();
};

export const logged = (req, res) => {
    return openRoute(req, res);
};

export const setRoutes = (app) => {
    _setRoutes(app);
    app.post('/auth', auth);
    app.get('/logged', authorize);
    app.get('/logged', logged);
};
