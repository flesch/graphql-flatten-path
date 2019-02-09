// This example of graphql-flatten-path can be run directly with a later
// version of Node (supporting more modern JS features).
const { graphql } = require('graphql');
const { makeExecutableSchema } = require('graphql-tools');
const { applyMiddleware } = require('graphql-middleware');

// Make sure to run "npm link graphql-flatten-path" in this directory.
// graphql-flatten-path isn't saved in package.json.
const flatten = require('graphql-flatten-path');

// Sample data normally found in a database.
const db = {
  transactions: [
    { id: 'AA4FBAgPDAIPDgEMBA8DBw', merchantId: 'CAYGCAYKAwYDBw8JBA8LDw', amount: 479.64, timestamp: 1549494790 },
    { id: 'BggDBwUICwYHAwwOBA0CDg', merchantId: 'Aw4ADQUMAQkPAwsMBAkKDg', amount: 613.57, timestamp: 1549411990 },
    { id: 'BQsKAQMICg0ABA0GBAYHCg', merchantId: 'CAYGCAYKAwYDBw8JBA8LDw', amount: 818.92, timestamp: 1548893590 },
    { id: 'DAwLCAwNDw8IDwQOBAEDBw', merchantId: 'AQwDDgAIBwABCAQBBA8IBQ', amount: 410.01, timestamp: 1546819990 },
    { id: 'BQcACAYFDA4ABgYMBAYHDw', merchantId: 'AgQJCAwOCQgADAMPBAENBw', amount: 272.13, timestamp: 1517962390 },
  ],
  merchants: [
    { id: 'CAYGCAYKAwYDBw8JBA8LDw', name: 'Kozey - Gutmann, Inc' },
    { id: 'Aw4ADQUMAQkPAwsMBAkKDg', name: 'Hane Group, LLC' },
    { id: 'AQwDDgAIBwABCAQBBA8IBQ', name: 'Bogisich - Goldner' },
    { id: 'AgQJCAwOCQgADAMPBAENBw', name: 'Schamberger, Reinger and Schmidt' },
  ],
};

const typeDefs = `
  type Merchant {
    id: ID!
    name: String!
    transactions: [Transaction!]!
  }

  type Transaction {
    id: ID!
    merchant: Merchant!
    amount: String!
    date: String! # You want an official DateTime scalar too, right?
  }

  type Query {
    merchant(id: ID!): Merchant!
    transactions: [Transaction!]!
  }
`;

// The usage section of the README said to add graphql-flatten-path to
// the resolvers, but they're missing here! Have we been lied to?!
const resolvers = {
  Query: {
    merchant: async (parent, args, context, info) => {
      return context.db.merchants.find((merchant) => {
        return merchant.id === args.id;
      });
    },
    transactions: async (parent, args, context, info) => {
      return context.db.transactions;
    },
  },
  Merchant: {
    transactions: async (parent, args, context, info) => {
      return context.db.transactions.filter((transaction) => {
        return transaction.merchantId === parent.id;
      });
    },
  },
  Transaction: {
    merchant: async (parent, args, context, info) => {
      return context.db.merchants.find((merchant) => {
        return merchant.id === parent.merchantId;
      });
    },
    amount: async (parent, args, context, info) => {
      const amount = parseFloat(parent.amount).toFixed(2);
      return `$${amount}`;
    },
    date: async (parent, args, context, info) => {
      return new Date(parent.timestamp * 1000).toUTCString();
    },
  },
};

// There it is! We're using a "middleware" resolver to apply this logic
// to every resolver. I could never lie to you.
const logResponseTimeMiddleware = async (resolver, parent, args, context, info) => {
  const path = flatten(info.path, info.operation).join('.');
  const result = await resolver(parent, args, context, info);
  const executionResponseTime = Date.now() - context.executionStartTime;
  if (executionResponseTime > 900) {
    console.warn(`WARNING: ${path} ==> ${executionResponseTime}ms ∙ exceeds the threshold by ${executionResponseTime - 900}ms!`);
  } else {
    console.log(`INFO: ${path} ==> ${executionResponseTime}ms`);
  }
  return result;
};

// For the purposes of this example, we're going to add some random
// latency to each resolver. Please don't actually do this.
// Note: This is defined after the "logResponseTimeMiddleware" middleware,
// but we'll apply it before further down.
const addLatencyMiddleware = async (resolver, parent, args, context, info) => {
  const executionStartTime = Date.now();
  await new Promise((resolve) => {
    setTimeout(resolve, Math.floor(Math.random() * (1000 - 250 + 1)) + 250);
  });
  return resolver(parent, args, { ...context, executionStartTime }, info);
};

// You've seen the rest before, so run `node index.js` (or `node .` if that's
// your jam).

const query = `
  query GetMerchantTransactions($merchantId: ID!) {
    merchant(id: $merchantId) {
      id
      name
      transactions {
        id
        amount
        date
      }
    }
  }
`;

const schema = makeExecutableSchema({ typeDefs, resolvers });
const schemaWithMiddleware = applyMiddleware(schema, addLatencyMiddleware, logResponseTimeMiddleware);

(async () => {
  const result = await graphql(schemaWithMiddleware, query, {}, { db }, { merchantId: 'CAYGCAYKAwYDBw8JBA8LDw' });
  console.log(JSON.stringify(result, null, 2));
})();
