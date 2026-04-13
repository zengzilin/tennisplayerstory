import { useState, useEffect } from 'react';

/**
 * @typedef {Object} Player
 * @property {string} name
 * @property {string} country
 */

/**
 * @typedef {Object} Match
 * @property {number} id
 * @property {{ player1: Player, player2: Player, score: { player1: number[], player2: number[] } }} score
 * @property {string} status
 * @property {string} tournament
 * @property {string} court
 * @property {string} round
 * @property {string} [startTime]
 */

/**
 * @returns {{ matches: Match[], loading: boolean }}
 */
export const useMatchData = () => {
  const [matches, setMatches] = /** @type {Match[]} */ ([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setMatches([
        {
          id: 1,
          player1: { name: 'Carlos Alcaraz', country: '🇪🇸' },
          player2: { name: 'Jannik Sinner', country: '🇮🇹' },
          score: { player1: [6, 4, 3], player2: [4, 6, 2] },
          status: 'Live',
          tournament: 'Australian Open',
          court: 'Rod Laver Arena',
          round: 'Quarterfinals'
        },
        {
          id: 2,
          player1: { name: 'Iga Świątek', country: '🇵🇱' },
          player2: { name: 'Aryna Sabalenka', country: '🇧🇾' },
          score: { player1: [7, 6], player2: [6, 4] },
          status: 'Live',
          tournament: 'Australian Open',
          court: 'Margaret Court Arena',
          round: 'Semifinals'
        },
        {
          id: 3,
          player1: { name: 'Novak Djokovic', country: '🇷🇸' },
          player2: { name: 'Daniil Medvedev', country: '🇷🇺' },
          score: { player1: [0, 0], player2: [0, 0] },
          status: 'Upcoming',
          tournament: 'Australian Open',
          court: 'Rod Laver Arena',
          round: 'Semifinals',
          startTime: '19:00'
        },
        {
          id: 4,
          player1: { name: 'Coco Gauff', country: '🇺🇸' },
          player2: { name: 'Elena Rybakina', country: '🇰🇿' },
          score: { player1: [6, 7, 6], player2: [4, 6, 3] },
          status: 'Completed',
          tournament: 'Australian Open',
          court: 'John Cain Arena',
          round: 'Quarterfinals'
        },
        {
          id: 5,
          player1: { name: 'Stefanos Tsitsipas', country: '🇬🇷' },
          player2: { name: 'Alexander Zverev', country: '🇩🇪' },
          score: { player1: [6, 3], player2: [7, 6] },
          status: 'Live',
          tournament: 'ATP Finals',
          court: 'Centre Court',
          round: 'Round Robin'
        },
        {
          id: 6,
          player1: { name: 'Jessica Pegula', country: '🇺🇸' },
          player2: { name: 'Ons Jabeur', country: '🇹🇳' },
          score: { player1: [0, 0], player2: [0, 0] },
          status: 'Upcoming',
          tournament: 'WTA Finals',
          court: 'Court 1',
          round: 'Round Robin',
          startTime: '14:30'
        }
      ]);
      setLoading(false);
    }, 500);
  }, []);

  return { matches, loading };
};
