# graphql-flatten-path

The `info` argument of a GraphQL resolver [can often be mysterious](https://www.prisma.io/blog/graphql-server-basics-demystifying-the-info-argument-in-graphql-resolvers-6f26249f613a/), but it doesn't have to be! `graphql-flatten-path` will "flatten" that path taken through each resolver, resulting in a one dimensional array of `fieldNames`.

![flatten](https://user-images.githubusercontent.com/13259/52522115-90c9fc00-2c46-11e9-8803-4d1570374d51.png)

## Install

To get started, add `graphql-flatten-path` to your project:

<div>
  <pre>$ npm install --save <a href="https://www.npmjs.com/package/graphql-flatten-path">graphql-flatten-path</a></pre>
</div>

## Usage

`graphql-flatten-path` is helpful when you're re-using resolvers or extending and stitching parts of a schema together, and need to know how the current field is nested under its ancestors.

It can be cumbersome to traverse a field's ancestors using `info.path`, which looks something like this:

```js
{
  "prev": {
    "prev": {
      "prev": {
        "key": "merchant"
      },
      "key": "transactions"
    },
    "key": 1
  },
  "key": "amount"
}
```

Instead, include `graphql-flatten-path` in your resolver to flatten `info.path` to an array of field names.

```diff
  import { graphql } from 'graphql';
+ import flatten from 'graphql-flatten-path';

  const resolvers = {
    Query: {
      merchant: async (parent, args, context, info) => {
+       const path = flatten(info.path, info.operation);
+       // path => ['query', 'merchant']
        return context.db.getMerchants();
      },
      transactions: async (parent, args, context, info) => {
+       const path = flatten(info.path);
+       // path => ['transactions', index]
        return context.db.transactions;
      },
    },
    Transaction: {
      amount: async (parent, args, context, info) => {
+       const path = flatten(info.path, info.operation);
+       // path => ['query', 'merchant', 'transactions', 1, 'amount']
+       //      or ['query', 'transactions', index, 'amount']
        return formatCurrency(parent.amount);
      },
    },
  };
```

For a more advanced use case, take a look at the [included example project](https://github.com/flesch/graphql-flatten-path/blob/master/example) that uses `graphql-flatten-path` inside a "[middleware](https://github.com/prisma/graphql-middleware/)" function to log the execution time of each resolver (and show a warning if a resolver took too long).

```
WARNING: query.merchant ==> 980ms ∙ exceeds the threshold by 80ms!
INFO: query.merchant.id ==> 427ms
INFO: query.merchant.name ==> 682ms
INFO: query.merchant.transactions ==> 749ms
INFO: query.merchant.transactions.0.id ==> 412ms
INFO: query.merchant.transactions.1.amount ==> 438ms
INFO: query.merchant.transactions.1.id ==> 453ms
INFO: query.merchant.transactions.0.amount ==> 504ms
WARNING: query.merchant.transactions.1.date ==> 929ms ∙ exceeds the threshold by 29ms!
```

## Motivation

Not to say this module doesn't have merit, but it could have been as simple as something like this:

```js
import find from 'find-key';
export default function (path) => {
  return find(path, 'key');
};
```

🙀 So why didn't I use an existing library like [find-key](https://github.com/simon-p-r/find-key)? Because I wanted to write something in Typescript and I like recursion, and I wanted to write something in Typescript and I like recursion.

## Contributing

[**graphql-flatten-path**](https://npm.im/graphql-flatten-path) is maintained by [John Flesch](mailto:john@fles.ch). Contributions are very much welcome!

## License

The MIT License (MIT)

Copyright (c) 2019 John Flesch <john@fles.ch> (https://github.com/flesch)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

<p align="center"><br /><sup>🐶 Made with <a href="https://www.instagram.com/murphythebeast/">a 7lb chiweenie</a> on my lap — near Chicago, IL</sup></p>
