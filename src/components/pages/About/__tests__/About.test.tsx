import { render, cleanup } from '@testing-library/react';
import About from '../About';

describe('About', () => {
  afterEach(cleanup);

  test('render About', () => {
    render(
        <About />
    );
  });
});
