import { Card, BestScore } from '@/types/card';

const CARDS_STORAGE_KEY = 'gdgoc-cards';

export class CardStorage {
  static getCards(): Card[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(CARDS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading cards from localStorage:', error);
      return [];
    }
  }

  static saveCards(cards: Card[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(cards));
    } catch (error) {
      console.error('Error saving cards to localStorage:', error);
    }
  }

  static updateCardBestScore(cardId: number, bestScore: BestScore): void {
    const cards = this.getCards();
    const cardIndex = cards.findIndex(card => card.id === cardId);

    if (cardIndex !== -1) {
      // Check if this is a better score than current best
      const currentBest = cards[cardIndex].best;
      if (!currentBest || bestScore.score > currentBest.score) {
        cards[cardIndex].best = bestScore;
        this.saveCards(cards);
      }
    }
  }

  static initializeDefaultCards(): Card[] {
    // faculties list removed as it is handled in page.tsx

    const targetImages = [
      "Aby", "America", "Banana", "Canada", "Coin", 
      "Computer", "Cookie", "Cup", "dava", "Duck", 
      "GDGOC Logo", "Germany", "Indonesia", "Italy", "Japan", 
      "Lock", "Shield", "Smartphone", "Sword", "Tel-U Logo", 
      "Treasure", "Trophy"
    ];

    const defaultCards: Card[] = targetImages.map((name, index) => ({
      id: index + 1,
      image: `/images/${name}.png`,
      name: name,
      best: null
    }));

    const existingCards = this.getCards();

    // If no cards exist, initialize with defaults
    if (existingCards.length === 0) {
      this.saveCards(defaultCards);
      return defaultCards;
    }

    // Update existing cards with the new names and images to fix broken paths 
    // from renamed files, while keeping the user's best scores intact
    const updatedCards = existingCards.map(card => {
      const defaultCard = defaultCards.find(dc => dc.id === card.id);
      if (defaultCard) {
        return {
          ...card,
          image: defaultCard.image,
          name: defaultCard.name
        };
      }
      return card;
    });

    // Check if we need to add any missing cards
    const maxExistingId = Math.max(...existingCards.map(card => card.id), 0);
    const missingCards = defaultCards.filter(card => card.id > maxExistingId);

    if (missingCards.length > 0) {
      updatedCards.push(...missingCards);
    }

    this.saveCards(updatedCards);
    return updatedCards;
  }

  static getCardById(cardId: number): Card | null {
    const cards = this.getCards();
    return cards.find(card => card.id === cardId) || null;
  }
}
