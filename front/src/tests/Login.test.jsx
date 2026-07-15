import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../pages/Login';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock useAuth
const mockLogin = vi.fn();
const mockRegister = vi.fn();
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    register: mockRegister,
  }),
}));

// Mock componentes decorativos para simplificar renderização
vi.mock('../components/PirateBackground', () => ({
  default: ({ children }) => <div data-testid="pirate-bg">{children}</div>,
}));
vi.mock('../components/UIPanel', () => ({
  default: ({ children }) => <div data-testid="ui-panel">{children}</div>,
}));
vi.mock('../components/PirateButton', () => ({
  default: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza formulário de login por padrão', () => {
    const { container } = render(<Login />);

    expect(screen.getByPlaceholderText('seu_usuario')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    // Botão submit existe
    expect(container.querySelector('button[type="submit"]')).toBeInTheDocument();
    // Não mostra campo de email em modo login
    expect(screen.queryByPlaceholderText('seu@email.com')).not.toBeInTheDocument();
  });

  it('alterna para formulário de cadastro ao clicar em Cadastrar', async () => {
    render(<Login />);
    const user = userEvent.setup();

    // Tab "Cadastrar" é o primeiro botão com esse texto (type="button" tab)
    await user.click(screen.getAllByText('Cadastrar')[0]);

    expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument();
    // Deve ter dois campos de senha (senha + confirmar)
    const passwordFields = screen.getAllByPlaceholderText('••••••••');
    expect(passwordFields).toHaveLength(2);
  });

  it('chama login com username e password e navega para /lobby', async () => {
    mockLogin.mockResolvedValue({ token: 'jwt', username: 'player1' });
    const { container } = render(<Login />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('seu_usuario'), 'player1');
    await user.type(screen.getByPlaceholderText('••••••••'), 'pass123');
    await user.click(container.querySelector('button[type="submit"]'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('player1', 'pass123');
      expect(mockNavigate).toHaveBeenCalledWith('/lobby');
    });
  });

  it('exibe erro quando login falha', async () => {
    mockLogin.mockRejectedValue(new Error('Credenciais inválidas'));
    const { container } = render(<Login />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('seu_usuario'), 'bad');
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrong');
    await user.click(container.querySelector('button[type="submit"]'));

    await waitFor(() => {
      expect(screen.getByText('Credenciais inválidas')).toBeInTheDocument();
    });
  });

  it('valida username curto no cadastro', async () => {
    const { container } = render(<Login />);
    const user = userEvent.setup();

    // Alternar para registro - usar getAllByRole e pegar a tab (type="button")
    const tabs = screen.getAllByText('Cadastrar');
    await user.click(tabs[0]); // first one is the tab

    await user.type(screen.getByPlaceholderText('seu_usuario'), 'ab');
    await user.type(screen.getByPlaceholderText('seu@email.com'), 'test@test.com');
    const passwordFields = screen.getAllByPlaceholderText('••••••••');
    await user.type(passwordFields[0], 'pass123');
    await user.type(passwordFields[1], 'pass123');

    // Submit
    await user.click(container.querySelector('button[type="submit"]'));

    expect(screen.getByText('Usuário deve ter entre 3 e 20 caracteres')).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('valida formato do username no cadastro', async () => {
    const { container } = render(<Login />);
    const user = userEvent.setup();

    await user.click(screen.getAllByText('Cadastrar')[0]);

    await user.type(screen.getByPlaceholderText('seu_usuario'), '123user');
    await user.type(screen.getByPlaceholderText('seu@email.com'), 'test@test.com');
    const passwordFields = screen.getAllByPlaceholderText('••••••••');
    await user.type(passwordFields[0], 'pass123');
    await user.type(passwordFields[1], 'pass123');
    await user.click(container.querySelector('button[type="submit"]'));

    expect(screen.getByText('Usuário deve começar com letra e conter apenas letras, números e _')).toBeInTheDocument();
  });

  it('valida email inválido no cadastro', async () => {
    const { container } = render(<Login />);
    const user = userEvent.setup();

    await user.click(screen.getAllByText('Cadastrar')[0]);

    await user.type(screen.getByPlaceholderText('seu_usuario'), 'validuser');
    // Simular email inválido via React state diretamente (type="email" em jsdom
    // aceita qualquer texto via fireEvent mas a validação do componente pode não triggar)
    const emailInput = screen.getByPlaceholderText('seu@email.com');
    // "a@b" não tem "." após o "@domínio", falha na regex ^[^\s@]+@[^\s@]+\.[^\s@]+$
    await user.type(emailInput, 'a@b');
    const passwordFields = screen.getAllByPlaceholderText('••••••••');
    await user.type(passwordFields[0], 'pass123');
    await user.type(passwordFields[1], 'pass123');
    await user.click(container.querySelector('button[type="submit"]'));

    expect(screen.getByText('E-mail inválido')).toBeInTheDocument();
  });

  it('valida senha curta no cadastro', async () => {
    const { container } = render(<Login />);
    const user = userEvent.setup();

    await user.click(screen.getAllByText('Cadastrar')[0]);

    await user.type(screen.getByPlaceholderText('seu_usuario'), 'validuser');
    await user.type(screen.getByPlaceholderText('seu@email.com'), 'test@test.com');
    const passwordFields = screen.getAllByPlaceholderText('••••••••');
    await user.type(passwordFields[0], 'ab1');
    await user.type(passwordFields[1], 'ab1');
    await user.click(container.querySelector('button[type="submit"]'));

    expect(screen.getByText('Senha deve ter no mínimo 6 caracteres')).toBeInTheDocument();
  });

  it('valida senha sem número no cadastro', async () => {
    const { container } = render(<Login />);
    const user = userEvent.setup();

    await user.click(screen.getAllByText('Cadastrar')[0]);

    await user.type(screen.getByPlaceholderText('seu_usuario'), 'validuser');
    await user.type(screen.getByPlaceholderText('seu@email.com'), 'test@test.com');
    const passwordFields = screen.getAllByPlaceholderText('••••••••');
    await user.type(passwordFields[0], 'abcdef');
    await user.type(passwordFields[1], 'abcdef');
    await user.click(container.querySelector('button[type="submit"]'));

    expect(screen.getByText('Senha deve conter pelo menos uma letra e um número')).toBeInTheDocument();
  });

  it('valida senhas não coincidem no cadastro', async () => {
    const { container } = render(<Login />);
    const user = userEvent.setup();

    await user.click(screen.getAllByText('Cadastrar')[0]);

    await user.type(screen.getByPlaceholderText('seu_usuario'), 'validuser');
    await user.type(screen.getByPlaceholderText('seu@email.com'), 'test@test.com');
    const passwordFields = screen.getAllByPlaceholderText('••••••••');
    await user.type(passwordFields[0], 'pass123');
    await user.type(passwordFields[1], 'pass456');
    await user.click(container.querySelector('button[type="submit"]'));

    expect(screen.getByText('As senhas não coincidem')).toBeInTheDocument();
  });

  it('chama register e navega ao cadastrar com sucesso', async () => {
    mockRegister.mockResolvedValue({ token: 'jwt', username: 'newuser' });
    const { container } = render(<Login />);
    const user = userEvent.setup();

    await user.click(screen.getAllByText('Cadastrar')[0]);

    await user.type(screen.getByPlaceholderText('seu_usuario'), 'newuser');
    await user.type(screen.getByPlaceholderText('seu@email.com'), 'new@test.com');
    const passwordFields = screen.getAllByPlaceholderText('••••••••');
    await user.type(passwordFields[0], 'pass123');
    await user.type(passwordFields[1], 'pass123');
    await user.click(container.querySelector('button[type="submit"]'));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('newuser', 'new@test.com', 'pass123');
      expect(mockNavigate).toHaveBeenCalledWith('/lobby');
    });
  });
});
