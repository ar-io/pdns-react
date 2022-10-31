import { render, cleanup } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import Home from '../Home';

describe('Home', () => {
  afterEach(cleanup);

  test('render Home', () => {
    render(
      <Router>
        <Home />
      </Router>,
    );
  });
});
