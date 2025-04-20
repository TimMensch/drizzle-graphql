# Drizzle-GraphQL

Automatically create GraphQL schema or customizable schema config fields from Drizzle ORM schema

## NOTES

This fork is being maintained by Tim Mensch. The original repo is being very slow to apply PRs, and I'm adding my updates here
to fix generation errors that are much harder to fix by massaging the output as described below.

### Using the fork:

I'm not currently creating my own npm package, but you can use this fork by adding the following to your `package.json`:

For Yarn:
```json
"drizzle-graphql": "TimMensch/drizzle-graphql#dist"
```
For npm/pnpm:
```json
"drizzle-graphql": "git+https://github.com/TimMensch/drizzle-graphql.git#dist"
```
Grab a specific SHA instead of `dist` if you want to pin to a specific commit. I keep finding things I want to fix, after all,
and I'm just some guy on the internet. If you're working with something important, by all means, pin so that I don't break anything
by accident.

If this goes on much longer I'll look into actually creating a package. I'll take suggestions on what to call it. :

### Fixes in this fork:

* Add "Count" to generated types for count queries (PostgreSQL only for now!)
* Fix handling of JSONB
* Fix handling of tsvector types
* Fix handling of generated columns

## Usage

-   Pass your drizzle database instance and schema into builder to generate `{ schema, entities }` object
-   Use `schema` if pre-built schema already satisfies all your neeeds. It's compatible witn any server that consumes `GraphQLSchema` class instance

    Example: hosting schema using [GraphQL Yoga](https://the-guild.dev/graphql/yoga-server)

    ```Typescript
    import { createServer } from 'node:http'
    import { createYoga } from 'graphql-yoga'
    import { buildSchema } from 'drizzle-graphql'

    // db - your drizzle instance
    import { db } from './database'

    const { schema } = buildSchema(db)

    const yoga = createYoga({ schema })

    server.listen(4000, () => {
        console.info('Server is running on http://localhost:4000/graphql')
    })
    ```

-   If you want to customize your schema, you can use `entities` object to build your own new schema

    ```Typescript
    import { createServer } from 'node:http'
    import { GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema } from 'graphql'
    import { createYoga } from 'graphql-yoga'
    import { buildSchema } from 'drizzle-graphql'

    // Schema contains 'Users' and 'Customers' tables
    import { db } from './database'

    const { entities } = buildSchema(db)

    // You can customize which parts of queries or mutations you want
    const schema = new GraphQLSchema({
        query: new GraphQLObjectType({
            name: 'Query',
            fields: {
                // Select only wanted queries out of all generated
                users: entities.queries.users,
                customer: entities.queries.customersSingle,

                // Create a custom one
                customUsers: {
                    // You can reuse and customize types from original schema
                    type: new GraphQLList(new GraphQLNonNull(entities.types.UsersItem)),
                    args: {
                        // You can reuse inputs as well
                        where: {
                            type: entities.inputs.UsersFilters
                        }
                    },
                    resolve: async (source, args, context, info) => {
                        // Your custom logic goes here...
                        const result = await db.select(schema.Users).where()...

                        return result
                    }
                }
            }
        }),
        // Same rules apply to mutations
        mutation: new GraphQLObjectType({
            name: 'Mutation',
            fields: entities.mutations
        }),
        // In case you need types inside your schema
        types: [...Object.values(entities.types), ...Object.values(entities.inputs)]
    })

    const yoga = createYoga({
        schema
    })

    server.listen(4000, () => {
        console.info('Server is running on http://localhost:4000/graphql')
    })
    ```
