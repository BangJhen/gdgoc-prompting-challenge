export interface BestScore {
  name: string;
  faculty?: string;
  prodi?: string;
  score: number;
}

export interface Card {
  id: number;
  image: string;
  name: string;
  best: BestScore | null;
}
