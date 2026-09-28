export interface ChallengeItem {
  id: number;
  text: string;
  game: string;
  difficulty: "Easy" | "Medium" | "Hard" | "IMPOSSIBLE";
}

// Shared by the Challenge Slot UI and /api/discord/report — the API only
// accepts a challenge id and looks the text up here, so callers can't post
// arbitrary content into Discord.
export const CHALLENGES: ChallengeItem[] = [
  { id: 1, text: "Pistols Only for 1 Full Match", game: "Valorant", difficulty: "Hard" },
  { id: 2, text: "No Armor for the Whole Expedition", game: "Valheim", difficulty: "Medium" },
  { id: 3, text: "Invert Mouse Y-Axis for 1 Round", game: "Valorant", difficulty: "IMPOSSIBLE" },
  { id: 4, text: "First-Person Driving Only", game: "GTA V", difficulty: "Easy" },
  { id: 5, text: "No Jumping for 10 Minutes", game: "Any Game", difficulty: "Medium" },
  { id: 6, text: "Whisper Like Horror ASMR for 5 mins", game: "Stream Vibe", difficulty: "Easy" },
  { id: 7, text: "Unbind the Use Key — No Looting", game: "Survival", difficulty: "Hard" },
  { id: 8, text: "Play with Screen Upside Down", game: "Viewer Special", difficulty: "IMPOSSIBLE" },
  { id: 9, text: "Knife-Only Eliminations Only", game: "Valorant", difficulty: "Hard" },
  { id: 10, text: "Speak Only in Movie Quotes for 1 Match", game: "Stream Vibe", difficulty: "Medium" },
  { id: 11, text: "Sensitivity Bumped to 10x for 1 Round", game: "FPS Any", difficulty: "IMPOSSIBLE" },
  { id: 12, text: "Crouch-Walk Everywhere for 10 min", game: "Any Game", difficulty: "Easy" },
  { id: 13, text: "No Minimap Allowed", game: "GTA V", difficulty: "Medium" },
  { id: 14, text: "Use Only the Worst Weapon in Inventory", game: "Survival", difficulty: "Hard" },
  { id: 15, text: "Sing Every Callout for 1 Match", game: "Valorant", difficulty: "Medium" },
  { id: 16, text: "No HUD Mode — Hide Health & Ammo", game: "FPS Any", difficulty: "Hard" },
  { id: 17, text: "Drive Only in Reverse Wherever Possible", game: "GTA V", difficulty: "Medium" },
  { id: 18, text: "Speedrun Solo Boss with No Heals", game: "Valheim", difficulty: "IMPOSSIBLE" },
  { id: 19, text: "One-Handed Keyboard Only", game: "Viewer Special", difficulty: "Hard" },
  { id: 20, text: "Hot Sauce Penalty on Every Death", game: "Stream Vibe", difficulty: "Easy" },
  { id: 21, text: "Switch Chair Every 60 Seconds", game: "Stream Vibe", difficulty: "Easy" },
  { id: 22, text: "Only Communicate with Soundboard", game: "Stream Vibe", difficulty: "Medium" },
  { id: 23, text: "No Sprint, No Crouch, No Jump", game: "Any Game", difficulty: "IMPOSSIBLE" },
  { id: 24, text: "Build Your Base Blindfolded for 2 min", game: "Valheim", difficulty: "Hard" },
];
