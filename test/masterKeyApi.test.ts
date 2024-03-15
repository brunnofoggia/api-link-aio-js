import debug_ from 'debug';
const debug = debug_('test:api');

import { HttpStatusCode } from 'axios';

import { openRoute, setRoutes as _setRoutes } from './publicApi.test';
import { logged } from './bearerApi.test';

export const port = 1990;

export const getToken = () => {
    return 'testtoken';
};

const authorize = (req, res, next) => {
    if (req.headers.authorization.split(' ')[1] !== getToken()) {
        return res.status(HttpStatusCode.Unauthorized).json({ message: 'Unauthorized' });
    }
    next();
};

export const setRoutes = (app) => {
    _setRoutes(app);
    app.get('/logged', authorize);
    app.get('/logged', logged);
};
