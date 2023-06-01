import dotenv from "dotenv";
import app, { corsOptions } from "./app";
dotenv.config();
import "reflect-metadata";
import { buildSchema } from "type-graphql";
import { ApolloServer } from "apollo-server-express";
import { ApolloServerPluginDrainHttpServer } from "apollo-server-core";
import config from "config";
import http from "http";
import { resolvers } from "./resolvers";
import connectDB from "./utils/connectDB";
import deserializeUser from "./middleware/deserializeUser";

async function bootstrap() {
  const httpServer = http.createServer(app);

  const schema = await buildSchema({
    resolvers,
    dateScalarMode: "isoDate",
  });

  const apolloServer = new ApolloServer({
    schema,
    csrfPrevention: true,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    context: ({ req, res }) => ({ req, res, deserializeUser }),
  });

  // Start the apolloServer
  await apolloServer.start();

  // Apply middleware
  apolloServer.applyMiddleware({ app, cors: corsOptions });

  // Listen on port
  const port = config.get<number>("PORT") || 4000;

  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));
  console.log(
    `Server ready at http://localhost:${port}${apolloServer.graphqlPath}`
  );

  // CONNECT MONGODB
  connectDB();

  process.on("unhandledRejection", (err: any) => {
    console.log("UNHANDLED REJECTION 🔥🔥  Shutting down...");
    console.log(err);
    console.error("Error", err.message);

    httpServer.close(async () => {
      process.exit(1);
    });
  });
}

bootstrap();
