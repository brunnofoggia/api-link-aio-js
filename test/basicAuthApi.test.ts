import debug_ from 'debug';
const debug = debug_('test:api');

import express from 'express';
import basicAuth from 'express-basic-auth';

import { openRoute, setRoutes as _setRoutes } from './publicApi.test';
import { size } from 'lodash';
import { getToken } from './masterKeyApi.test';

// Define your basic authentication credentials
const users = {
    someuser: 'somepass',
};

export const createApp = (setRoutes_) => {
    const app = express();

    // Rota para autenticação básica
    app.use(
        '/auth',
        basicAuth({
            users,
        }),
    );

    // Rota para entrega do token de portador se estiver autorizado
    app.use('/auth', (req, res) => {
        if (size(req.auth) >= 2) {
            const userPass = users[req.auth.user];
            if (userPass === req.auth.password) {
                const bearerToken = getToken();
                return res.json({ token: bearerToken });
            }
        }
        return res.sendStatus(401);
    });

    app.use(express.json());
    setRoutes(app);

    return app;
};

const logged = (req, res) => {
    return openRoute(req, res);
};

export const setRoutes = (app) => {
    _setRoutes(app);
    // Rota para validar o token de portador antes de permitir o acesso
    app.use('/logged', (req, res, next) => {
        const bearerToken = req.headers.authorization?.split(' ')[1];

        if (bearerToken === getToken()) {
            return next();
        }
        res.sendStatus(401);
    });

    app.get('/logged', logged);
};
