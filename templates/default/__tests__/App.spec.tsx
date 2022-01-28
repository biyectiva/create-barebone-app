import { render, RenderResult } from '@testing-library/react';
import { App } from '../src/App';

let documentBody: RenderResult;

describe('<App />', () => {
  beforeEach(() => {
    documentBody = render(<App />);
  });
  it('shows welcome message', () => {
    expect(documentBody.getByText('Hello world!')).toBeInTheDocument();
  });
});