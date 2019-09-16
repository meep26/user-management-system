const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');
const schemaDirectives = require('./graphql/directives');
const mongoose = require('mongoose');

const { getUser } = require('./auth');

const { PORT, FRONTEND_URL, NODE_ENV, DB_URI } = process.env;
const IN_PROD = NODE_ENV === 'production';

(async () => {
  try {
    await mongoose.connect(DB_URI, { useNewUrlParser: true });

    const app = express();
    app.disable('x-powered-by');

    const apolloServer = new ApolloServer({
      typeDefs,
      resolvers,
      schemaDirectives,
      playground: !IN_PROD,
      context: ({ req }) => {
        const tokenWithBearer = req.headers.authorization || '';
        const token = tokenWithBearer.split(' ')[1];
        const user = getUser(token);

        return { req, user };
      }
    });

    apolloServer.applyMiddleware({
      app,
      cors: { origin: FRONTEND_URL, credentials: true }
    });

    app.listen(PORT, () =>
      console.log(`http://localhost:${PORT}${apolloServer.graphqlPath}`)
    );
  } catch (e) {
    console.log(e);
  }
})();
