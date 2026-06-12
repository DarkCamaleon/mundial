import { Match } from '../models/models';

export const INITIAL_MATCHES: Match[] = [
  // GRUPO A
  { id: 'A_1', group: 'A', teamA: 'MEXICO', teamB: 'SUDAFRICA', scoreA: null, scoreB: null, status: 'cancelled', order: 1 },
  { id: 'A_2', group: 'A', teamA: 'COREA DEL SUR', teamB: 'REP. CHECA', scoreA: null, scoreB: null, status: 'cancelled', order: 2 },
  { id: 'A_3', group: 'A', teamA: 'REP. CHECA', teamB: 'SUDAFRICA', scoreA: null, scoreB: null, status: 'pending', order: 3 },
  { id: 'A_4', group: 'A', teamA: 'MEXICO', teamB: 'COREA DEL SUR', scoreA: null, scoreB: null, status: 'pending', order: 4 },
  { id: 'A_5', group: 'A', teamA: 'SUDAFRICA', teamB: 'COREA DEL SUR', scoreA: null, scoreB: null, status: 'pending', order: 5 },
  { id: 'A_6', group: 'A', teamA: 'REP. CHECA', teamB: 'MEXICO', scoreA: null, scoreB: null, status: 'pending', order: 6 },

  // GRUPO B
  { id: 'B_1', group: 'B', teamA: 'CANADA', teamB: 'BOSNIA', scoreA: null, scoreB: null, status: 'pending', order: 1 },
  { id: 'B_2', group: 'B', teamA: 'CATAR', teamB: 'SUIZA', scoreA: null, scoreB: null, status: 'pending', order: 2 },
  { id: 'B_3', group: 'B', teamA: 'SUIZA', teamB: 'BOSNIA', scoreA: null, scoreB: null, status: 'pending', order: 3 },
  { id: 'B_4', group: 'B', teamA: 'CANADA', teamB: 'CATAR', scoreA: null, scoreB: null, status: 'pending', order: 4 },
  { id: 'B_5', group: 'B', teamA: 'SUIZA', teamB: 'CANADA', scoreA: null, scoreB: null, status: 'pending', order: 5 },
  { id: 'B_6', group: 'B', teamA: 'BOSNIA', teamB: 'CATAR', scoreA: null, scoreB: null, status: 'pending', order: 6 },

  // GRUPO C
  { id: 'C_1', group: 'C', teamA: 'BRASIL', teamB: 'MARRUECOS', scoreA: null, scoreB: null, status: 'pending', order: 1 },
  { id: 'C_2', group: 'C', teamA: 'HAITI', teamB: 'ESCOCIA', scoreA: null, scoreB: null, status: 'pending', order: 2 },
  { id: 'C_3', group: 'C', teamA: 'ESCOCIA', teamB: 'MARRUECOS', scoreA: null, scoreB: null, status: 'pending', order: 3 },
  { id: 'C_4', group: 'C', teamA: 'BRASIL', teamB: 'HAITI', scoreA: null, scoreB: null, status: 'pending', order: 4 },
  { id: 'C_5', group: 'C', teamA: 'MARRUECOS', teamB: 'HAITI', scoreA: null, scoreB: null, status: 'pending', order: 5 },
  { id: 'C_6', group: 'C', teamA: 'ESCOCIA', teamB: 'BRASIL', scoreA: null, scoreB: null, status: 'pending', order: 6 },

  // GRUPO D
  { id: 'D_1', group: 'D', teamA: 'EEUU', teamB: 'PARAGUAY', scoreA: null, scoreB: null, status: 'pending', order: 1 },
  { id: 'D_2', group: 'D', teamA: 'AUSTRALIA', teamB: 'TURQUIA', scoreA: null, scoreB: null, status: 'pending', order: 2 },
  { id: 'D_3', group: 'D', teamA: 'EEUU', teamB: 'AUSTRALIA', scoreA: null, scoreB: null, status: 'pending', order: 3 },
  { id: 'D_4', group: 'D', teamA: 'TURQUIA', teamB: 'PARAGUAY', scoreA: null, scoreB: null, status: 'pending', order: 4 },
  { id: 'D_5', group: 'D', teamA: 'TURQUIA', teamB: 'EEUU', scoreA: null, scoreB: null, status: 'pending', order: 5 },
  { id: 'D_6', group: 'D', teamA: 'PARAGUAY', teamB: 'AUSTRALIA', scoreA: null, scoreB: null, status: 'pending', order: 6 },

  // GRUPO E
  { id: 'E_1', group: 'E', teamA: 'ALEMANIA', teamB: 'CURAZAO', scoreA: null, scoreB: null, status: 'pending', order: 1 },
  { id: 'E_2', group: 'E', teamA: 'COSTA DE MARFIL', teamB: 'ECUADOR', scoreA: null, scoreB: null, status: 'pending', order: 2 },
  { id: 'E_3', group: 'E', teamA: 'ALEMANIA', teamB: 'COSTA DE MARFIL', scoreA: null, scoreB: null, status: 'pending', order: 3 },
  { id: 'E_4', group: 'E', teamA: 'ECUADOR', teamB: 'CURAZAO', scoreA: null, scoreB: null, status: 'pending', order: 4 },
  { id: 'E_5', group: 'E', teamA: 'CURAZAO', teamB: 'COSTA DE MARFIL', scoreA: null, scoreB: null, status: 'pending', order: 5 },
  { id: 'E_6', group: 'E', teamA: 'ECUADOR', teamB: 'ALEMANIA', scoreA: null, scoreB: null, status: 'pending', order: 6 },

  // GRUPO F
  { id: 'F_1', group: 'F', teamA: 'PAISES BAJOS', teamB: 'JAPON', scoreA: null, scoreB: null, status: 'pending', order: 1 },
  { id: 'F_2', group: 'F', teamA: 'SUECIA', teamB: 'TUNEZ', scoreA: null, scoreB: null, status: 'pending', order: 2 },
  { id: 'F_3', group: 'F', teamA: 'PAISES BAJOS', teamB: 'SUECIA', scoreA: null, scoreB: null, status: 'pending', order: 3 },
  { id: 'F_4', group: 'F', teamA: 'TUNEZ', teamB: 'JAPON', scoreA: null, scoreB: null, status: 'pending', order: 4 },
  { id: 'F_5', group: 'F', teamA: 'TUNEZ', teamB: 'PAISES BAJOS', scoreA: null, scoreB: null, status: 'pending', order: 5 },
  { id: 'F_6', group: 'F', teamA: 'JAPON', teamB: 'SUECIA', scoreA: null, scoreB: null, status: 'pending', order: 6 },

  // GRUPO G
  { id: 'G_1', group: 'G', teamA: 'BELGICA', teamB: 'EGIPTO', scoreA: null, scoreB: null, status: 'pending', order: 1 },
  { id: 'G_2', group: 'G', teamA: 'IRAN', teamB: 'NUEVA ZELANDA', scoreA: null, scoreB: null, status: 'pending', order: 2 },
  { id: 'G_3', group: 'G', teamA: 'BELGICA', teamB: 'IRAN', scoreA: null, scoreB: null, status: 'pending', order: 3 },
  { id: 'G_4', group: 'G', teamA: 'NUEVA ZELANDA', teamB: 'EGIPTO', scoreA: null, scoreB: null, status: 'pending', order: 4 },
  { id: 'G_5', group: 'G', teamA: 'NUEVA ZELANDA', teamB: 'BELGICA', scoreA: null, scoreB: null, status: 'pending', order: 5 },
  { id: 'G_6', group: 'G', teamA: 'EGIPTO', teamB: 'IRAN', scoreA: null, scoreB: null, status: 'pending', order: 6 },

  // GRUPO H
  { id: 'H_1', group: 'H', teamA: 'ESPAÑA', teamB: 'CABO VERDE', scoreA: null, scoreB: null, status: 'pending', order: 1 },
  { id: 'H_2', group: 'H', teamA: 'ARABIA SAUDITA', teamB: 'URUGUAY', scoreA: null, scoreB: null, status: 'pending', order: 2 },
  { id: 'H_3', group: 'H', teamA: 'ESPAÑA', teamB: 'ARABIA SAUDITA', scoreA: null, scoreB: null, status: 'pending', order: 3 },
  { id: 'H_4', group: 'H', teamA: 'URUGUAY', teamB: 'CABO VERDE', scoreA: null, scoreB: null, status: 'pending', order: 4 },
  { id: 'H_5', group: 'H', teamA: 'CABO VERDE', teamB: 'ARABIA SAUDITA', scoreA: null, scoreB: null, status: 'pending', order: 5 },
  { id: 'H_6', group: 'H', teamA: 'URUGUAY', teamB: 'ESPAÑA', scoreA: null, scoreB: null, status: 'pending', order: 6 },

  // GRUPO I
  { id: 'I_1', group: 'I', teamA: 'FRANCIA', teamB: 'SENEGAL', scoreA: null, scoreB: null, status: 'pending', order: 1 },
  { id: 'I_2', group: 'I', teamA: 'IRAK', teamB: 'NORUEGA', scoreA: null, scoreB: null, status: 'pending', order: 2 },
  { id: 'I_3', group: 'I', teamA: 'FRANCIA', teamB: 'IRAK', scoreA: null, scoreB: null, status: 'pending', order: 3 },
  { id: 'I_4', group: 'I', teamA: 'NORUEGA', teamB: 'SENEGAL', scoreA: null, scoreB: null, status: 'pending', order: 4 },
  { id: 'I_5', group: 'I', teamA: 'NORUEGA', teamB: 'FRANCIA', scoreA: null, scoreB: null, status: 'pending', order: 5 },
  { id: 'I_6', group: 'I', teamA: 'SENEGAL', teamB: 'IRAK', scoreA: null, scoreB: null, status: 'pending', order: 6 },

  // GRUPO J
  { id: 'J_1', group: 'J', teamA: 'AUSTRIA', teamB: 'JORDANIA', scoreA: null, scoreB: null, status: 'pending', order: 1 },
  { id: 'J_2', group: 'J', teamA: 'ARGENTINA', teamB: 'ARGELIA', scoreA: null, scoreB: null, status: 'pending', order: 2 },
  { id: 'J_3', group: 'J', teamA: 'ARGENTINA', teamB: 'AUSTRIA', scoreA: null, scoreB: null, status: 'pending', order: 3 },
  { id: 'J_4', group: 'J', teamA: 'JORDANIA', teamB: 'ARGELIA', scoreA: null, scoreB: null, status: 'pending', order: 4 },
  { id: 'J_5', group: 'J', teamA: 'ARGELIA', teamB: 'AUSTRIA', scoreA: null, scoreB: null, status: 'pending', order: 5 },
  { id: 'J_6', group: 'J', teamA: 'JORDANIA', teamB: 'ARGENTINA', scoreA: null, scoreB: null, status: 'pending', order: 6 },

  // GRUPO K
  { id: 'K_1', group: 'K', teamA: 'PORTUGAL', teamB: 'REP. DEL CONGO', scoreA: null, scoreB: null, status: 'pending', order: 1 },
  { id: 'K_2', group: 'K', teamA: 'UZBEKISTAN', teamB: 'COLOMBIA', scoreA: null, scoreB: null, status: 'pending', order: 2 },
  { id: 'K_3', group: 'K', teamA: 'PORTUGAL', teamB: 'UZBEKISTAN', scoreA: null, scoreB: null, status: 'pending', order: 3 },
  { id: 'K_4', group: 'K', teamA: 'COLOMBIA', teamB: 'REP. DEL CONGO', scoreA: null, scoreB: null, status: 'pending', order: 4 },
  { id: 'K_5', group: 'K', teamA: 'COLOMBIA', teamB: 'PORTUGAL', scoreA: null, scoreB: null, status: 'pending', order: 5 },
  { id: 'K_6', group: 'K', teamA: 'REP. DEL CONGO', teamB: 'UZBEKISTAN', scoreA: null, scoreB: null, status: 'pending', order: 6 },

  // GRUPO L
  { id: 'L_1', group: 'L', teamA: 'INGLATERRA', teamB: 'CROACIA', scoreA: null, scoreB: null, status: 'pending', order: 1 },
  { id: 'L_2', group: 'L', teamA: 'GHANA', teamB: 'PANAMA', scoreA: null, scoreB: null, status: 'pending', order: 2 },
  { id: 'L_3', group: 'L', teamA: 'INGLATERRA', teamB: 'GHANA', scoreA: null, scoreB: null, status: 'pending', order: 3 },
  { id: 'L_4', group: 'L', teamA: 'PANAMA', teamB: 'CROACIA', scoreA: null, scoreB: null, status: 'pending', order: 4 },
  { id: 'L_5', group: 'L', teamA: 'PANAMA', teamB: 'INGLATERRA', scoreA: null, scoreB: null, status: 'pending', order: 5 },
  { id: 'L_6', group: 'L', teamA: 'CROACIA', teamB: 'GHANA', scoreA: null, scoreB: null, status: 'pending', order: 6 },
];

export const OFFICIAL_SCORES_FROM_IMAGE: { [matchId: string]: { scoreA: number, scoreB: number, status: 'played' | 'cancelled' } } = {
  // GRUPO A
  'A_1': { scoreA: 0, scoreB: 0, status: 'cancelled' },
  'A_2': { scoreA: 0, scoreB: 0, status: 'cancelled' },
  'A_3': { scoreA: 2, scoreB: 0, status: 'played' },
  'A_4': { scoreA: 1, scoreB: 1, status: 'played' },
  'A_5': { scoreA: 0, scoreB: 1, status: 'played' },
  'A_6': { scoreA: 0, scoreB: 1, status: 'played' },

  // GRUPO B
  'B_1': { scoreA: 1, scoreB: 1, status: 'played' },
  'B_2': { scoreA: 0, scoreB: 2, status: 'played' },
  'B_3': { scoreA: 1, scoreB: 0, status: 'played' },
  'B_4': { scoreA: 2, scoreB: 0, status: 'played' },
  'B_5': { scoreA: 2, scoreB: 1, status: 'played' },
  'B_6': { scoreA: 2, scoreB: 0, status: 'played' },

  // GRUPO C
  'C_1': { scoreA: 2, scoreB: 1, status: 'played' },
  'C_2': { scoreA: 0, scoreB: 2, status: 'played' },
  'C_3': { scoreA: 0, scoreB: 1, status: 'played' },
  'C_4': { scoreA: 4, scoreB: 0, status: 'played' },
  'C_5': { scoreA: 3, scoreB: 0, status: 'played' },
  'C_6': { scoreA: 0, scoreB: 2, status: 'played' },

  // GRUPO D
  'D_1': { scoreA: 1, scoreB: 1, status: 'played' },
  'D_2': { scoreA: 0, scoreB: 2, status: 'played' },
  'D_3': { scoreA: 2, scoreB: 1, status: 'played' },
  'D_4': { scoreA: 1, scoreB: 0, status: 'played' },
  'D_5': { scoreA: 1, scoreB: 1, status: 'played' },
  'D_6': { scoreA: 1, scoreB: 0, status: 'played' },

  // GRUPO E
  'E_1': { scoreA: 4, scoreB: 0, status: 'played' },
  'E_2': { scoreA: 1, scoreB: 2, status: 'played' },
  'E_3': { scoreA: 3, scoreB: 1, status: 'played' },
  'E_4': { scoreA: 3, scoreB: 0, status: 'played' },
  'E_5': { scoreA: 0, scoreB: 2, status: 'played' },
  'E_6': { scoreA: 1, scoreB: 2, status: 'played' },

  // GRUPO F
  'F_1': { scoreA: 2, scoreB: 1, status: 'played' },
  'F_2': { scoreA: 2, scoreB: 1, status: 'played' },
  'F_3': { scoreA: 3, scoreB: 1, status: 'played' },
  'F_4': { scoreA: 0, scoreB: 1, status: 'played' },
  'F_5': { scoreA: 0, scoreB: 3, status: 'played' },
  'F_6': { scoreA: 1, scoreB: 1, status: 'played' },

  // GRUPO G
  'G_1': { scoreA: 2, scoreB: 0, status: 'played' },
  'G_2': { scoreA: 2, scoreB: 0, status: 'played' },
  'G_3': { scoreA: 2, scoreB: 0, status: 'played' },
  'G_4': { scoreA: 0, scoreB: 2, status: 'played' },
  'G_5': { scoreA: 0, scoreB: 3, status: 'played' },
  'G_6': { scoreA: 2, scoreB: 1, status: 'played' },

  // GRUPO H
  'H_1': { scoreA: 5, scoreB: 0, status: 'played' },
  'H_2': { scoreA: 0, scoreB: 2, status: 'played' },
  'H_3': { scoreA: 3, scoreB: 0, status: 'played' },
  'H_4': { scoreA: 3, scoreB: 0, status: 'played' },
  'H_5': { scoreA: 0, scoreB: 1, status: 'played' },
  'H_6': { scoreA: 0, scoreB: 2, status: 'played' },

  // GRUPO I
  'I_1': { scoreA: 3, scoreB: 1, status: 'played' },
  'I_2': { scoreA: 0, scoreB: 3, status: 'played' },
  'I_3': { scoreA: 4, scoreB: 0, status: 'played' },
  'I_4': { scoreA: 2, scoreB: 1, status: 'played' },
  'I_5': { scoreA: 1, scoreB: 2, status: 'played' },
  'I_6': { scoreA: 2, scoreB: 0, status: 'played' },

  // GRUPO J
  'J_1': { scoreA: 2, scoreB: 0, status: 'played' },
  'J_2': { scoreA: 2, scoreB: 1, status: 'played' },
  'J_3': { scoreA: 1, scoreB: 0, status: 'played' },
  'J_4': { scoreA: 0, scoreB: 1, status: 'played' },
  'J_5': { scoreA: 1, scoreB: 2, status: 'played' },
  'J_6': { scoreA: 0, scoreB: 3, status: 'played' },

  // GRUPO K
  'K_1': { scoreA: 2, scoreB: 0, status: 'played' },
  'K_2': { scoreA: 0, scoreB: 2, status: 'played' },
  'K_3': { scoreA: 3, scoreB: 0, status: 'played' },
  'K_4': { scoreA: 3, scoreB: 1, status: 'played' },
  'K_5': { scoreA: 1, scoreB: 2, status: 'played' },
  'K_6': { scoreA: 1, scoreB: 0, status: 'played' },

  // GRUPO L
  'L_1': { scoreA: 2, scoreB: 0, status: 'played' },
  'L_2': { scoreA: 2, scoreB: 1, status: 'played' },
  'L_3': { scoreA: 2, scoreB: 0, status: 'played' },
  'L_4': { scoreA: 0, scoreB: 2, status: 'played' },
  'L_5': { scoreA: 1, scoreB: 4, status: 'played' },
  'L_6': { scoreA: 1, scoreB: 0, status: 'played' },
};
