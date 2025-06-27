import { createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';
import { useReactive } from 'ahooks';

import api from '../libs/api';

const ResourceContext = createContext({});
const { Provider, Consumer } = ResourceContext;

function ResourceProvider({ children }) {
  const pageState = useReactive({
    componentDid: '',
    components: [],
    resources: [],
    loading: false,
  });

  const loadResources = async () => {
    pageState.loading = true;
    await api
      .get('/api/resources', {
        params: {
          componentDid: pageState.componentDid,
        },
      })
      .then(({ data }) => {
        (data.resource || []).forEach((item) => {
          item._id = item.name;
          item.originalName = item.name;
        });
        pageState.resources = data.resources;
        pageState.componentDid = data.componentDid;
        pageState.components = data.components || [];
        pageState.loading = false;
      })
      .catch(console.error);

    return pageState;
  };

  return (
    <Provider
      value={{
        ...pageState,
        loadResources: debounce(loadResources, 50),
        filterByComponent: (componentDid) => {
          pageState.resources = [];
          pageState.componentDid = componentDid;
          loadResources();
        },
      }}>
      {children}
    </Provider>
  );
}

ResourceProvider.propTypes = {
  children: PropTypes.any.isRequired,
};

function useResourceContext() {
  const result = useContext(ResourceContext);
  return result;
}

export { ResourceContext, ResourceProvider, Consumer as ResourceConsumer, useResourceContext };
