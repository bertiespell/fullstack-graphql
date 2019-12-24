import React, {useState } from 'react'
import gql from 'graphql-tag'
import { useQuery, useMutation } from '@apollo/react-hooks' // hooks apollo has created to interact with graphQL
import PetsList from '../components/PetsList'
import NewPetModal from '../components/NewPetModal'
import Loader from '../components/Loader'

// other directives (skip - i.e. if a certain variable is passed)
// @include (if certain is passed)
// @defer
// @live


// On server
// @deprecated (avoid versioning)


const PETS_FIELDS = gql`
  fragment PetsField on Pet {
    name
    id
    img
    type
    vaccinated @client
    owner {
      id
      age @client
    }
  }
`;

const GET_PETS = gql`
  query getPets {
    pets {
      ...PetsField 
      # name
      # id
      # img
      # type
      # owner {
      #   id
      #   # age doesn't exist on server - so this directive syntax says this exists on the CLIENT - mix things together seamlessly!
      #   age @client 
      # }
    }
  }
  ${PETS_FIELDS}
`;

const CREATE_PET = gql`
  mutation CreateAPet($newPet: NewPetInput!) {
    addPet(input: $newPet) {
      # ALL THESE FIELDS ARE NOW DUPLICATED ALL OVER THE PLACE - We can avoid this by using FRAGMENTS
      # name
      # id
      # img
      # type
      # # WE ALSO HAVE TO UPDATE MUTATION
      # owner {
      #   id
      #   age @client
      # }

      # THIS IS A FRAGMENT - Spreading over the fields
      ...PetsField 
    }
  }
  # Adding fragment to operation
  ${PETS_FIELDS} 
`;


export default function Pets () {
  const [modal, setModal] = useState(false) // hoooks return array - first argument is the state you want to keep track off (we're destructing) - second thing is a function used to update state in first arg

  // changing state causes a re-render

  // Find any query that needs to know about the mutation we just performed
  // This then updates the cache - 
  // Write back to query and set data yourself!
  const [createPet, newPet] = useMutation(CREATE_PET, {
    update(cache, { data: { addPet } }) { // this mimics what the server would send back - so here addPet has to reflect the actual name (or alias) in the query above
      const { pets } = cache.readQuery({ query: GET_PETS });
      cache.writeQuery({
        query: GET_PETS, // this is what the server would send out - doing it manually
        data: { pets: [addPet].concat(pets) },
      });
    },
    // Optimistic Response avoids having a loading screen - e.g. allows you to layout the page as though the data were already there. Here it happens every single time this is invoked - i.e. it's global 
    // Can't do this though if you need access to some variables
    // optimisticResponse: {}
  });

  const {data, loading, error} = useQuery(GET_PETS);
  if (loading) return <Loader />;

  console.log(data, error);

  if (error || newPet.error) return (<div><p>{error.Error}</p></div>);
  const onSubmit = input => {
    createPet({
      variables: {
        newPet: input,
        // no simple way to use fragment here
        optimisticResponse: {
          __typename: "Mutation", // has to replicat it exactly
          addPet: { // the name of the actual mutation
            name: input.name, // all fields must be here
            id: Date.now(),
            img: 'http://placeholder.com/300',
            type: input.type,
            vaccinated: true,
            owner: {
              id: Date.now(),
              age: 35
            },
            __typename: "Pet"
          }
        } // YOU CAN ALSO ADD OPTIMINST RESPONSE HERE. If you invoke it here it will only happen this once - in this invocation (and not again)... IF you need access to the variables(!!) then you'll have to put it here - where you atually have access to them!
      }
    });
    setModal(false)
  }
  
  if (modal) {
    return <NewPetModal onSubmit={onSubmit} onCancel={() => setModal(false)} />
  }

  return (
    <div className="page pets-page">
      <section>
        <div className="row betwee-xs middle-xs">
          <div className="col-xs-10">
            <h1>Pets</h1>
          </div>

          <div className="col-xs-2">
            <button onClick={() => setModal(true)}>new pet</button>
          </div>
        </div>
      </section>
      <section>
        <PetsList pets={data.pets}/>
      </section>
    </div>
  )
}
