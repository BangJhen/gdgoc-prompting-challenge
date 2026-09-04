import { Card, BestScore } from '@/types/card';

const CARDS_STORAGE_KEY = 'gdgoc-cards';

export class CardStorage {
  static async getCards(): Promise<Card[]> {
    if (typeof window === 'undefined') return [];
    try {
      const res = await fetch('/api/scores');
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching cards from API:', error);
      return [];
    }
  }

  static async saveCards(cards: Card[]): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cards)
      });
    } catch (error) {
      console.error('Error saving cards to API:', error);
    }
  }

  static async updateCardBestScore(cardId: number, bestScore: BestScore): Promise<void> {
    const cards = await this.getCards();
    const cardIndex = cards.findIndex(card => card.id === cardId);

    if (cardIndex !== -1) {
      // Check if this is a better score than current best
      const currentBest = cards[cardIndex].best;
      if (!currentBest || bestScore.score > currentBest.score) {
        cards[cardIndex].best = bestScore;
        await this.saveCards(cards);
      }
    }
  }

  static async initializeDefaultCards(): Promise<Card[]> {
    const targetImages = [
      "Aby.png", "America.png", "Banana.png", "Canada.png", "Coin.png", 
      "Computer.png", "Cookie.png", "Cup.png", "dava.png", "Duck.png", 
      "GDGOC Logo.png", "Germany.png", "Indonesia.png", "Italy.png", "Japan.png", 
      "Lock.png", "Shield.png", "Smartphone.png", "Sword.png", "Tel-U Logo.png", 
      "Treasure.png", "Trophy.png", "Gojo Satoru.jpeg", "Luffy.jpeg", "No Na Baila.jpeg", "Spiderman.jpg"
    ];

    const defaultCards: Card[] = targetImages.map((filename, index) => {
      // Remove the extension for the display name
      const name = filename.replace(/\.[^/.]+$/, "");
      return {
        id: index + 1,
        image: `/images/${filename}`,
        name: name,
        best: null
      };
    });

    const existingCards = await this.getCards();

    // If no cards exist, initialize with defaults
    if (existingCards.length === 0) {
      await this.saveCards(defaultCards);
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

    await this.saveCards(updatedCards);
    return updatedCards;
  }

  static async getCardById(cardId: number): Promise<Card | null> {
    const cards = await this.getCards();
    return cards.find(card => card.id === cardId) || null;
  }
}
