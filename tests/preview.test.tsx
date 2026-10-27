import { deviceApi } from '../src/platform/android/client';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../src/app/App';
import { AppProvider } from '../src/presentation/AppProvider';
describe('Android-only interface preview', () => {
  it('keeps native actions disabled without an Android bridge', () => {
    render(
      <AppProvider gateway={deviceApi}>
        <App />
      </AppProvider>,
    );
    expect(screen.getByText(/Prévia da interface/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Teclado' }));
    ['1', '9', '0'].forEach((name) => fireEvent.click(screen.getByRole('button', { name })));
    expect(screen.getByRole('button', { name: 'Ligar' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Proteção' }));
    expect(screen.getByRole('switch')).toBeDisabled();
    expect(screen.getByText('Verificação indisponível')).toBeInTheDocument();
  });
});
