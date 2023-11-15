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
    resources: [],
    buckets: [],
    loading: false,
  });

  const loadResources = async () => {
    pageState.loading = true;
    await api
      .get('/api/uploads/resources', {
        params: {
          componentDid: pageState.componentDid,
        },
      })
      .then(({ data }) => {
        pageState.buckets = data.buckets;
        pageState.componentDid = data.componentDid;
        (data.resource || []).forEach((item) => {
          item._id = item.name;
        });
        pageState.resources = data.resources || [];
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
        filterByBucket: (componentDid) => {
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

ResourceProvider.defaultProps = {};

function useResourceContext() {
  const result = useContext(ResourceContext);
  return result;
}

export { ResourceContext, ResourceProvider, Consumer as ResourceConsumer, useResourceContext };
