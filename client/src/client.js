import { ApolloClient } from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { HttpLink } from 'apollo-link-http'
import { ApolloLink } from 'apollo-link'
import { setContext } from 'apollo-link-context'

import gql from 'graphql-tag'

/**
 * Create a new apollo client and export as default
 */

const typeDefs = gql`
    extend type User {
        # This does NOT exist on the server, it isn't going to push it onto the server or anything - it's just extending it client side 
        age: Int 
    }

    extend type Pet {
        vaccinated: Boolean!
    }
`;

const resolvers = {
    User: {
        age() {
            return 35
        }
    },
    Pet: {
        vaccinated() {
            return true
        }
    }
}

const httplink = new HttpLink({uri: 'http://localhost:4000/'}) // network interface to access graphql server (network level) new HTP
const cache = new InMemoryCache();
const delay = setContext( // simulate delay on front-end using this hook
    request => new Promise((success, fail) => {
        setTimeout(() => {
            success()
        }, 800)
    })
)

const link = ApolloLink.from([
    delay, // put them in order you want to run (can use this for middleware!)
    httplink
])

const client = new ApolloClient({
    link,
    cache,
    resolvers, // ADD OUR RESOLVERS AND TYPE DEFS HERE - to extend schema client side
    typeDefs,
});

// const query = gql`
//     {
//         characters {
//             results {
//                 name
//             }
//         }
//     }
// `;

// client.query({ query }).then(result=> console.log(result));

export default client;