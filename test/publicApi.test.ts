import { HttpStatusCode } from 'axios';
import debug_ from 'debug';
const debug = debug_('test:api');

import express from 'express';

export const openRoute = (req, res) => {
    const response = {
        receivedData: {
            method: req.method,
            body: req.body,
            headers: req.headers,
            query: req.query,
        },
    };

    res.json(response);
};

export const errRoute = (req, res) => {
    const response = {};
    res.status(HttpStatusCode.BadRequest).json(response);
};

export const setRoutes = (app) => {
    app.get('/test', openRoute);
    app.post('/test', openRoute);
    app.put('/test', openRoute);
    app.delete('/test', openRoute);
    app.patch('/test', openRoute);
    app.get('/testerr', errRoute);
};

export const createApp = (setRoutes_) => {
    const app = express();

    app.use(express.json());
    setRoutes_(app);

    return app;
};

export const createServer = async (app, port) => {
    return new Promise((resolve) => {
        const server = app.listen({ port }, () => {
            // debug(`Server is running on port ${port}`);
            resolve(server);
        });
    });
};

export const closeServer = (server) => {
    return new Promise((resolve) => {
        server.close(() => {
            // debug('Server is closed');
            resolve({});
        });
    });
};
