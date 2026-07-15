import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Lobby from '../pages/Lobby';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock useGame
const mockConnect = vi.fn().mockResolvedValue();
const mockCreateRoom = vi.fn();
const mockJoinRoom = vi.fn();
const mockStartSinglePlayer = vi.fn();
const mockJoinMatchmaking = vi.fn();
const mockLeaveMatchmaking = vi.fn();
const mockSubscribeToGame = vi.fn();
const mockResetGame = vi.fn();
const mockLeaveGame = vi.fn();

let mockGameState = null;
let mockRoomCode = null;
let mockError = null;
let mockConnectionStatus = 'disconnected';

vi.mock('../hooks/useGame', () => ({
  useGame: () => ({
    connect: mockConnect,
    connected: false,
    createRoom: mockCreateRoom,
    joinRoom: mockJoinRoom,
    startSinglePlayer: mockStartSinglePlayer,
    joinMatchmaking: mockJoinMatchmaking,
    leaveMatchmaking: mockLeaveMatchmaking,
    subscribeToGame: mockSubscribeToGame,
    resetGame: mockResetGame,
    leaveGame: mockLeaveGame,
    roomCode: mockRoomCode,
    gameState: mockGameState,
    error: mockError,
    connectionStatus: mockConnectionStatus,
    reconnectInfo: null,
  }),
}));

// Mock useSound
vi.mock('../hooks/useSound', () => ({
  useSound: () => ({
    play: vi.fn(),
    startMusic: vi.fn(),
    stopMusic: vi.fn(),
    toggleMute: vi.fn(),
    muted: false,
  }),
}));

// Mock fetchProfile
vi.mock('../services/api', () => ({
  fetchProfile: vi.fn().mockResolvedValue({ moedas: 50 }),
}));

// Mock componentes decorativos
vi.mock('../components/PirateBackground', () => ({
  default: ({ children }) => <div data-testid="pirate-bg">{children}</div>,
}));
vi.mock('../components/UIPanel', () => ({
  default: ({ children }) => <div data-testid="ui-panel">{children}</div>,
}));
vi.mock('../components/PirateButton', () => ({
  default: ({ children, onClick, ...props }) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));
vi.mock('../components/WaitingScreen', () => ({
  default: ({ title, subtitle, description, onCancel }) => (
    <div data-testid="waiting-screen">
      {title && <span data-testid="waiting-title">{title}</span>}
      {subtitle && <span data-testid="waiting-subtitle">{subtitle}</span>}
      {description && <span data-testid="waiting-description">{description}</span>}
      {onCancel && <button onClick={onCancel} data-testid="cancel-btn">Cancelar</button>}
    </div>
  ),
}));
vi.mock('../components/ProfileModal', () => ({
  default: ({ onClose }) => <div data-testid="profile-modal"><button onClick={onClose}>Close</button></div>,
}));
vi.mock('../components/ShopModal', () => ({
  default: ({ onClose }) => <div data-testid="shop-modal"><button onClick={onClose}>Close</button></div>,
}));

describe('Lobby page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGameState = null;
    mockRoomCode = null;
    mockError = null;
    mockConnectionStatus = 'disconnected';
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('username', 'testplayer');
  });

  it('renderiza botões de ação principais', () => {
    render(<Lobby />);

    expect(screen.getByText('Criar sala')).toBeInTheDocument();
    expect(screen.getByText('Contra o Capitão (Bot)')).toBeInTheDocument();
    expect(screen.getByText('Buscar Oponente')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('ABCD')).toBeInTheDocument();
  });

  it('exibe username no header', () => {
    render(<Lobby />);
    expect(screen.getByText('testplayer')).toBeInTheDocument();
  });

  it('exibe moedas após carregar perfil', async () => {
    render(<Lobby />);
    await waitFor(() => {
      expect(screen.getByText('50')).toBeInTheDocument();
    });
  });

  it('chama resetGame ao montar', () => {
    render(<Lobby />);
    expect(mockResetGame).toHaveBeenCalled();
  });

  it('chama connect e createRoom ao clicar Criar sala', async () => {
    render(<Lobby />);
    const user = userEvent.setup();

    await user.click(screen.getByText('Criar sala'));

    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalled();
      expect(mockCreateRoom).toHaveBeenCalled();
    });
  });

  it('chama connect e startSinglePlayer ao clicar Bot', async () => {
    render(<Lobby />);
    const user = userEvent.setup();

    await user.click(screen.getByText('Contra o Capitão (Bot)'));

    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalled();
      expect(mockStartSinglePlayer).toHaveBeenCalled();
    });
  });

  it('chama connect e joinMatchmaking ao clicar Buscar Oponente', async () => {
    render(<Lobby />);
    const user = userEvent.setup();

    await user.click(screen.getByText('Buscar Oponente'));

    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalled();
      expect(mockJoinMatchmaking).toHaveBeenCalled();
    });
  });

  it('chama joinRoom com código ao clicar Entrar', async () => {
    render(<Lobby />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('ABCD'), 'xyzw');
    await user.click(screen.getByText('Entrar'));

    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalled();
      expect(mockJoinRoom).toHaveBeenCalledWith('XYZW');
    });
  });

  it('não chama joinRoom se código estiver vazio', async () => {
    render(<Lobby />);
    const user = userEvent.setup();

    await user.click(screen.getByText('Entrar'));

    expect(mockConnect).not.toHaveBeenCalled();
    expect(mockJoinRoom).not.toHaveBeenCalled();
  });

  it('converte código para uppercase no input', async () => {
    render(<Lobby />);
    const user = userEvent.setup();

    const input = screen.getByPlaceholderText('ABCD');
    await user.type(input, 'abcd');

    expect(input.value).toBe('ABCD');
  });
});
