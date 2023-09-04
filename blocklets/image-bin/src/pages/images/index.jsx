/* eslint-disable jsx-a11y/label-has-associated-control */
import styled from '@emotion/styled';

import UploadHistory from '../../components/history';

function ImageList() {
  return (
    <Div>
      <section id="image-list" className="history">
        <UploadHistory />
      </section>
    </Div>
  );
}

const Div = styled.div`
  padding: 24px 0;
`;

export default ImageList;
