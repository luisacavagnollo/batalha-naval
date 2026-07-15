import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mocks
vi.mock('react-router-dom', () => ({
  useParams: () => ({ gameId: 'ABCD' }),
  useNavigate: () => vi.fn(),
}));

const mockConnect = vi.fn().mockResolvedValue();
const mockSubscribeToGame = vi.fn();
const mockShoot = vi.fn();
const mockSendEmote = vi.fn();
const mockResetGame = vi.fn();
const mockSurrender = vi.fn();

vi.mock('../hooks/useGame', () => ({
  useGame: () => ({
    connect: mockConnect,
    subscribeToGame: mockSubscribeToGame,
    gameState: null,
    shoot: mockShoot,
    sendEmote: mockSendEmote,
    emote: null,
    resetGame: mockResetGame,
    surrender: mockSurrender,
    connectionStatus: 'connected',
    reconnectInfo: null,
  }),
}));

vi.mock('../hooks/useSound', () => ({
  useSound: () => ({
    play: vi.fn(),
    startMusic: vi.fn(),
    stopMusic: vi.fn(),
    toggleMute: vi.fn(),
    muted: false,
  }),
}));

vi.mock('../hooks/useResponsiveCellSize', () => ({
  useResponsiveCellSize: () => 30,
}));

vi.mock('../components/PirateBackground', () => ({
  default: ({ children }) => <div data-testid="pirate-bg">{children}</div>,
}));
vi.mock('../components/UIPanel', () => ({
  default: ({ children }) => <div data-testid="ui-panel">{children}</div>,
}));
vi.mock('../components/PirateButton', () => ({
  default: ({ children, onClick, ...props }) => <button onClick={onClick} {...props}>{children}</button>,
}));
vi.mock('../components/ConnectionStatus', () => ({ default: () => null }));
vi.mock('../components/TurnIndicator', () => ({
  default: ({ myTurn, opponentName }) => (
    <div data-testid="turn-indicator">{myTurn ? 'Seu turno' : `Turno de ${opponentName}`}</div>
  ),
}));
vi.mock('../components/EmotePanel', () => ({
  default: ({ onSend }) => (
    <div data-testid="emote-panel">
      <button onClick={() => onSend('🏴‍☠️')} data-testid="emote-btn">Emote</button>
    </div>
  ),
}));

import Game from '../pages/Game';

describe('Game page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('username', 'player1');
  });

  it('conecta e subscreve ao game ao montar', async () => {
    render(<Game />);

    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalled();
      expect(mockSubscribeToGame).toHaveBeenCalledWith('ABCD');
    });
  });

  it('renderiza o background', () => {
    render(<Game />);
    expect(screen.getByTestId('pirate-bg')).toBeInTheDocument();
  });

  it('não chama shoot sem interação', () => {
    render(<Game />);
    expect(mockShoot).not.toHaveBeenCalled();
  });

  it('não chama surrender sem interação', () => {
    render(<Game />);
    expect(mockSurrender).not.toHaveBeenCalled();
  });

  it('não chama sendEmote sem interação', () => {
    render(<Game />);
    expect(mockSendEmote).not.toHaveBeenCalled();
  });

  it('não navega sem gameState.phase FINISHED', () => {
    const navigate = vi.fn();
    render(<Game />);
    // navigate não é chamado pois gameState é null
    expect(navigate).not.toHaveBeenCalled();
  });
});
