// src/components/Search.jsx
import algoliasearch from 'algoliasearch/lite';
import { InstantSearch, SearchBox, Hits } from 'react-instantsearch-dom';

const searchClient = algoliasearch(
  process.env.REACT_APP_ALGOLIA_APP_ID,
  process.env.REACT_APP_ALGOLIA_SEARCH_KEY
);

export default function Search() {
  return (
    <InstantSearch searchClient={searchClient} indexName="items">
      <SearchBox />
      <Hits hitComponent={HitComponent} />
    </InstantSearch>
  );
}

function HitComponent({ hit }) {
  return (
    <div>
      <h3>{hit.title}</h3>
      <p>{hit.description}</p>
    </div>
  );
}