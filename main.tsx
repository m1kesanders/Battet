import { Devvit, useState, useAsync, useInterval, FormFunction, FormOnSubmitEvent, useChannel, User, Context } from '@devvit/public-api';

Devvit.configure({
  redditAPI: true,
  redis: true,
  realtime: true,
});

// Battet data and related types
interface BattetMove {
  DMG: number;
  BP: number;
  HIT_CHANCE: number;
  TYPE: string[];
  Description: string;
  MoveCase: number;
}

interface BattetData {
  [key: string]: any; // Allow arbitrary keys with any values
  name: {
    Regular: string;
    Rare: string;
    Legendary: string;
  };
  nick_name: string;
  description: {
    Regular: string;
    Rare: string;
    Legendary: string;
  };
  breed: boolean;
  level: number;
  xp: number;
  xp_to_next_level: number;
  price: number;
  passives: {
    Regular: Record<string, string>;
    Rare: Record<string, string>;
    Legendary: Record<string, string>;
  };
  type: {
    Regular: string[];
    Rare: string[];
    Legendary: string[];
  };
  weakness: {
    Regular: string[];
    Rare: string[];
    Legendary: string[];
  }
  stats: Record<string, number>;
  moves: {
    Regular: Record<string, BattetMove>;
    Rare: Record<string, BattetMove>;
    Legendary: Record<string, BattetMove>;
  };
  image: {
    Regular: string[];
    Rare: string[];
    Legendary: string[];
    Egg: string[];
  };
}

interface UserBattetData {
 [key: string]: any;
  name: string;  // Single value based on rarity
  nick_name: string;
  description: string;  // Single value based on rarity
  breed: boolean;
  level: number;
  xp: number;
  xp_to_next_level: number;
  price: number;
  statusEffects: string[]; 
  passives: Record<string, string>;  // Simplified to a single object
  type: string[];  // Simplified to a single array based on rarity
  weakness: string[];
  stats: Record<string, number>;
  moves: Record<string, BattetMove>;  // Simplified to a single set of moves
  selectedMoves: Record<string, BattetMove>;
  image: string[];  // Simplified to a single array based on rarity
}

// Battet data
const battets: BattetData[] = [
  {
    name: {
      Regular: 'Chadette',
      Rare: 'Rare Chadette',
      Legendary: 'Legendary Chadette'
    },
    nick_name: "",
    description: {
      Regular: "A strange fuzzy Battet, why's it looking at you like that?",
      Rare: "Rare to find, said to only come from when a Chadette is locked in the underworld.",
      Legendary: "They say when you look out and see the blood slashed moon the ultimate Chadette has come to rid you and your family of their sins.",
    },
    breed: true,
    level: 1,
    xp: 0,
    xp_to_next_level: 0,
    price: 1,
    passives:{
      Regular: {
        Sturdy: "+5 hp every level",
        Fast: "+50 speed",
      },
      Rare: {
        Poison_Affluent: "Cannot be poisoned. Half damage taken from poison attacks.",
        Darkness_Birth: "Harder to hit, must roll twice before seeing if they can hit.",
      },
      Legendary: {
        Birthed_in_Light: "Heals 15 hp a round, half damage taken from darkness attacks.",
        Sanctuary: "10% chance to nullify opponent ability.",
      },
    },
    type: {
      Regular: ['Water', 'Normal'],
      Rare: ['Poison', 'Dark'],
      Legendary: ['Light', "Flying", "Normal"],
    },
    weakness: {
      Regular: ['Electric', 'Dark'],
      Rare: ['Water', 'Light'],
      Legendary: ['Mech', 'Ground', 'Dark'],
    },
    stats: {
      MAXHP: 0,
      HP: 0,
      MAXBP: 0,
      BP: 0,
      ATK: 0,
      DEF: 0,
      LOOKS: 0,
    },
    moves: { 
      Regular: {
        Punch: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Normal', 'Blunt'], Description: "Punches enemy", MoveCase: 0},
        Kick: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Normal', 'Blunt'], Description: "Kicks enemy", MoveCase: 1},
        WaterShield: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Water', 'Support'], Description: "Conjures a shield of water: Def +20", MoveCase: 2},
        WaterJets: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Water', 'Support'], Description: "Shoots jets of water having the chance to hit the target 3 times.", MoveCase: 3},
        Sleep: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Normal', 'Support'], Description: "Has a chance to put the target to sleep.", MoveCase: 12},
        Charm: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Normal', 'Support'], Description: "Has a chance to make the target miss attack", MoveCase: 14},
        Push: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Normal', 'Blunt'], Description: "Shoves, chance to make target lose accuracy.", MoveCase: 15}
      },

      Rare: {
        Poison_Mist: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Poison', 'Support'], Description: "Affected enemy takes hp damage each turn.", MoveCase: 4},
        Darkness: {DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Dark', 'Support', 'Area'], Description: "You have +dark type dmg, - enemy accuracy.", MoveCase: 5},
        Shadow_Lance: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Dark', 'Piercing'], Description: "Throws a lance of conjured shadow energy.", MoveCase: 6},
        Wither: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Dark', 'Necrotic'], Description: "Damage relative to amount of target HP, Target is likely to dodge with high hp.", MoveCase: 7},
      },

      Legendary: {
        Celestial_Flight: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Light', 'Flying'], Description: "Accuracy for enemy decreased, does damage.", MoveCase: 8},
        Blood_Slash: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Normal', 'Slashing'], Description: "Cleaves target, applies bleed dmg.", MoveCase: 9},
        Aura_of_Protection: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Light', 'Support'], Description: "Damage reflected back at attacker.", MoveCase: 10},
        Nullify: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Normal', 'Support'], Description: "Nullifies all status effects on target", MoveCase: 21},
        Divine_Smite: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Light', 'Area'], Description: "Does damage to target and half that to next.", MoveCase: 11},
      },
    },
    image: {
      Regular: ['main_chadette.png'],
      Rare: ['rare_chadette.png'],
      Legendary: ['legendary_chadette.png'],
      Egg: ['chadette_egg.png'],
    },
  },
  {
    name: {
      Regular: 'Pluff',
      Rare: 'Rare Pluff',
      Legendary: 'Legendary Pluff',
    },
    nick_name: "",
    description:{
      Regular: "A sleepy being that rests on the clouds.",
      Rare: "Very rarely a Pluff will have trouble sleeping, when that happens the clouds they hover by darken and they glow with energy",
      Legendary: "A Pluff that never sleeps, has ascended into a permanent electrical charge.",
    },
    breed: true,
    level: 1,
    xp: 0,
    xp_to_next_level: 0,
    price: 0,
    passives: {
      Regular: {
        Overslept: "Cannot be put to sleep.",
        Pillow: "Defense + 5 per level.",
      },
      Rare:{
        Grumpy: "Atk +5 per level.",
        ElectricBody: "Chance to Paralyze target on hit.",
      },
      Legendary: {
        Unstable: "Aplies double damage on attack",
        Blitz: "Speed +150",
      },
    },
    type: {
      Regular: ['Normal', 'Flying'],
      Rare: ['Electric', 'Flying'],
      Legendary: ['Electric', 'Flying', 'Normal'],
    },
    weakness: {
      Regular: ['Dark', 'Ground'],
      Rare: ['Ground'],
      Legendary: ['Ground', 'Dark'],
    },
    stats: {
      MAXHP: 0,
      HP: 0,
      MAXBP: 0,
      BP: 0,
      ATK: 0,
      DEF: 0,
      LOOKS: 0,
    },
    moves: { 
      Regular: {
        Sleep: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Normal', 'Support'], Description: "Has a chance to put the target to sleep.", MoveCase: 12},
        Punch: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Normal', 'Blunt'], Description: "Punches enemy", MoveCase: 0},
        Smoke: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Fire', 'Support'], Description: "Coats the target in smoke lowering their accuracy.", MoveCase: 23},
        Kick: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Normal', 'Blunt'], Description: "Kicks enemy", MoveCase: 1},
        Fly: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Flying', 'Support'], Description: "Flies high up decreasing target's accuracy", MoveCase: 13}, 
        Charm: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Normal', 'Support'], Description: "Has a chance to make the target miss attack", MoveCase: 14},
        Push: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Normal', 'Blunt'], Description: "Shoves, chance to make target lose accuracy.", MoveCase: 15}
      },
      Rare: {
        Electric_Rays: {DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Electic', 'Multi'], Description: "Shoots 1-3 electrical rays, each does electric damage and has a chance to paralyze.", MoveCase: 16},
        Stun: {DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Electric', 'Support'], Description: "Paralyzes target if succesful", MoveCase: 17},
        Fly: {DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Flying', 'Support'], Description: "Flies high up decreasing target's next accuracy.", MoveCase: 13},
        Pulse: {DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Electric', 'Support'], Description: "Lowers DEF of target, chance to paralyze", MoveCase: 18},
      },
      Legendary: {
        Paralyzing_Field: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Electric', 'Support', 'Area'], Description: "Paralyzes target and next Battet in opponent's party.", MoveCase: 19},
        Lasting_Electric_Orb: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Electric', 'Support', 'DOT'], Description: "Damages target each turn.", MoveCase: 20},
        Nullify: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Normal', 'Support'], Description: "Nullifies all status effects on target", MoveCase: 21},
        Celestial_Flight: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Light', 'Flying'], Description: "Accuracy for enemy decreased, does damage.", MoveCase: 8},
        Column_of_Lightning: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Electric', 'Area'], Description: "Does electrical damage and heals you.", MoveCase: 22},
      },
    },
    image: {
      Regular: ['main_pluff.png'],
      Rare: ['rare_pluff.png'],
      Legendary: ['legendary_pluff.png'],
      Egg: ['pluff_egg.png'],
    },
  },
  {
    name: {
      Regular: 'Ves',
      Rare: 'Rare Ves',
      Legendary: 'Legendary Ves',
    },
    nick_name: "",
    description:{
      Regular: "Ves are a group of wild sparks, usually erupting near volcanic regions. Every they go the ground erupts with them.",
      Rare: "There once was a volcano in a jungle, this jungle had a record breaking heatwave. The volcano erupted, that's all that's known of this strange Ves that has evolved in a rapidly explosive fashion.",
      Legendary: "After years of exploding the very few that manage to avoid burning out evolve to a state past flame. With full control of plant life and flame this Ves has achieved the ultimate form.",
    },
    breed: true,
    level: 1,
    xp: 0,
    xp_to_next_level: 0,
    price: 0,
    passives: {
      Regular: {
        Magma_Body: "Attacks do five fire damage to attackers.",
        Light_Source: "Not affected by darkness and dark attacks are halved.",
      },
      Rare:{
        Explosive: "Fire attacks deal an additional 50 damage.",
        Overheated: "Water attacks are no longer super effective.",
      },
      Legendary: {
        Seeds_of_Rejuvenation: "Gain +25 HP each turn in combat, unless under a status effect.",
        Rebirth: "5% chance to gain +200 hp. + level",
      },
    },
    type: {
      Regular: ['Fire'],
      Rare: ['Fire', 'Grass'],
      Legendary: ['Fire', 'Grass', 'Psychic'],
    },
    weakness: {
      Regular: ['Water'],
      Rare: ['Water'],
      Legendary: ['Water', 'Normal'],
    },
    stats: {
      MAXHP: 0,
      HP: 0,
      MAXBP: 0,
      BP: 0,
      ATK: 0,
      DEF: 0,
      LOOKS: 0,
    },
    moves: { 
      Regular: {
        Smoke: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Fire', 'Support'], Description: "Coats the target in smoke lowering their accuracy.", MoveCase: 23},
        Magma_Pop: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Fire'], Description: "Does fire damage and possibly burns.", MoveCase: 24}, 
        Burrow: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Ground', 'Support'], Description: "Makes you immune to all damage besides ground attacks.", MoveCase: 25},
        Melt: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Fire'], Description: "Does major fire damage at the sacrifice of half your hp.", MoveCase: 26}
      },
      Rare: {
        Fire_Blast: {DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Fire'], Description: "Shoots a fireball at the target, possibly inflicting burn.", MoveCase: 27},
        Fire_Vine: {DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Fire', 'Grass'], Description: "Possibly entangles and burns target.", MoveCase: 28},
        Fire_Shield: {DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Fire', 'Support'], Description: "Resistant to all forms of damage reflects physical damage back as fire.", MoveCase: 29},
        Fire_Seeds: {DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Fire', 'Grass', 'DOT'], Description: "Does three random amount of damage compounded.", MoveCase: 30},
      },
      Legendary: {
        Tree_of_Fire: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Grass', 'Fire'], Description: "Deals fire damage, flaming bark armor encircles the Ves Defense up.", MoveCase: 31},
        Mind_Rend: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Psychic', 'DOT'], Description: "Target takes psychic damage and loses 10 to all abilities for the duration of the battle.", MoveCase: 32},
        Solar_Flare_Storm: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Fire', 'Multi'], Description: "Hits target with up to 5 hits does fire damage and possibly inflects burn.", MoveCase: 33},
        Entangled_Flames: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Fire', 'Grass'], Description: "On hit target cannot do any physical attacks.", MoveCase: 34},
      },
    },
    image: {
      Regular: ['main_ves.png'],
      Rare: ['rare_ves.png'],
      Legendary: ['legendary_ves.png'],
      Egg: ['ves_egg.png'],
    },
  },
  {
    name: {
      Regular: 'Robo',
      Rare: 'Rare Robo',
      Legendary: 'Legendary Robo',
    },
    nick_name: "",
    description:{
      Regular: "Beep-Boo-Bop What am I doing here?",
      Rare: "A Robo with mysterious upgrades, no one quite knows where they come from.",
      Legendary: "The most advanced, yet gluttonus Robo around. With it's multiple tentacles and top of the line power converters it spends all day just just absorbing energy.",
    },
    breed: true,
    level: 1,
    xp: 0,
    xp_to_next_level: 0,
    price: 0,
    passives: {
      Regular: {
        Hardwired: "Cannot be affected by any status ailemtns or benefits.",
        Plating: "Battle Points +5 every level",
      },
      Rare:{
        Scanners: "Speed +10 per level.",
        Electric: "Has chance to paralyze target on melee hit.",
      },
      Legendary: {
        Gluttonus: "Takes targets passive away from them and takes it as it's own for the duration of the battle.",
        Quad_Attack: "Attacks that do damage do quadruple damage.",
      },
    },
    type: {
      Regular: ['Mech', 'Electric'],
      Rare: ['Electric', 'Poison'],
      Legendary: ['Mech', 'Dark', 'Electric'],
    },
    weakness: {
      Regular: ['Water', 'Psychic'],
      Rare: ['Water'],
      Legendary: ['Water', 'Normal', 'Psychic'],
    },
    stats: {
      MAXHP: 0,
      HP: 0,
      MAXBP: 0,
      BP: 0,
      ATK: 0,
      DEF: 0,
      LOOKS: 0,
    },
    moves: { 
      Regular: {
        Punch: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Normal', 'Blunt'], Description: "Punches enemy", MoveCase: 0},
        Kick: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Normal', 'Blunt'], Description: "Kicks enemy", MoveCase: 1},
        Push: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Normal', 'Blunt'], Description: "Shoves, chance to make target lose accuracy.", MoveCase: 15},
        Stabilize: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Mech', 'Support'], Description: "Increases accuracy and removes one status effect.", MoveCase: 35},
        Short_Circuit: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Electric', 'Mech'], Description: "does electric damage, chance to paralyze.", MoveCase: 36}, 
        Charge: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Normal', 'Blunt'], Description: "Charges at target doing blunt damage, chance to lower accuracy.", MoveCase: 37},
        Shields_Charged: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Mech', 'Support'], Description: "charges shields, substantially raises defense", MoveCase: 38}
      },
      Rare: {
        Poison_Mist: {DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Poison', 'Support'], Description: "Shoots a mist of poison out poisoning target.", MoveCase: 4},
        Shadow_Lance: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Dark', 'Piercing'], Description: "Throws a lance of conjured shadow energy.", MoveCase: 6},
        Thunder_Shock: {DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Electric'], Description: "Shocks for heavy damage applies paralysis.", MoveCase: 39},
        Poison_Charge: {DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Poison', 'Normal'], Description: "Does physical damage with a chance to poison and lower accuracy.", MoveCase: 40},
        Paralyzing_Ray: {DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Electric', 'Support'], Description: "applies paralysis to target.", MoveCase: 41},
      },
      Legendary: {
        Electrical_Drain: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Electric', 'Support'], Description:"No electrical moves can be used against Robo and electric types take damage per turn.", MoveCase: 42},
        Mech_Control: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Mech', 'Support', 'Area'], Description: "A Mech type in opponent's party is selected and reduced to 0 HP.", MoveCase: 43},
        Dark_Electric_Blast: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Dark', 'Electric', 'Area'], Description: "Does damage to target and drains defense by 30.", MoveCase: 44},
        Absorb: { DMG: 0, BP: 0, HIT_CHANCE: 0, TYPE: ['Mech', 'Support'], Description: "Absorbs part of target hp and stats.", MoveCase: 45},
      },
    },
    image: {
      Regular: ['main_robo.png'],
      Rare: ['rare_robo.png'],
      Legendary: ['legendary_robo.png'],
      Egg: ['robo_egg.png'],
    },
  },
   // Add more Battets as needed...
];

//function to get random rarity
function getRandomRarity(): 'Regular' | 'Rare' | 'Legendary' {
  const roll = Math.random();
  if (roll < 0.05) return 'Legendary'; //70% chance for main
  if (roll < 0.30) return 'Rare'; //20% chance for rare
  return 'Regular'; //10% chance for legendary
}

//function to get random element from an array
function getRandomElement<T>(array: T[]): T {
  const index = Math.floor(Math.random() * array.length);
  return array[index];
}

//function to calculate coins
function calculateCoins(user: any, comments: any) {
  let coins = 0;

  coins += user.commentKarma;
  coins += 2 * user.linkKarma;
  console.log('Base coins:', coins);

  if (comments && Array.isArray(comments.data)) {
    comments.data.forEach((comment: any) => {
      coins += comment.score;
      console.log(`Adding score from comment ${comment.id}: ${comment.score}, Total: ${coins}`);
    });
  }

  console.log('Total coins:', coins);
  return coins;
}

async function getOrInitializeUserCoins(context: any, user: any) {
  const coinsKey = `${user.username}_${context.subredditName}_coins`;
  try {
    let coins = await context.redis.get(coinsKey);

    if (coins === null) {
      console.log(`Initializing coins for user ${user.username}`);
      const comments = await context.reddit.getCommentsByUser({
        username: user.username,
        sort: 'new',
        limit: 100,
      });
      coins = calculateCoins(user, comments);
      await context.redis.set(coinsKey, coins.toString());
      console.log(`Initialized ${coins} coins for user ${user.username}`);
    } else {
      console.log(`Retrieved coins for user ${user.username}: ${coins}`);
      coins = parseInt(coins.replace(/[^0-9]/g, ''), 10);
      if (isNaN(coins)) {
        console.error(`Invalid coin value stored for user ${user.username}`);
        coins = 0;
      }
    }
    
    return coins;
  } catch (error) {
    console.error(`Error in getOrInitializeUserCoins for user ${user.username}:`, error);
    return 0; // Return a default value
  }
}

function createRandomBattet(): UserBattetData {
  const randomBattet = getRandomElement(battets);  // Get a random Battet from the list
  const rarity = getRandomRarity();  // Select the rarity (Regular, Rare, Legendary)
  const maxHp = Math.floor((Math.random() * 251) + 250);
  const maxBp = Math.floor((Math.random() * 251) + 250);

  // Select four random moves based on rarity, ensuring no repeating move names
  const availableMoves = randomBattet.moves[rarity];  // Get available moves for the selected rarity
  const selectedMoves: { [key: string]: BattetMove } = {};
  const selectedMoveNames = new Set<string>();  // Track selected move names to avoid duplicates

  while (Object.keys(selectedMoves).length < 4) {
    const randomMoveKey = getRandomElement(Object.keys(availableMoves));  // Randomly select a move
    const move = availableMoves[randomMoveKey];

    if (!selectedMoveNames.has(move.Description)) {
      selectedMoves[randomMoveKey] = move; // Add the move to the selected moves
      for(let i = 0; i < move.TYPE.length; i++){
        let isSupport = move.TYPE[i] === 'Support';
        if(isSupport){
          move.DMG = 0;
          move.HIT_CHANCE = Math.floor((Math.random() * 26) + 75);
          move.BP = Math.floor((Math.random() * 26) + 25);
          break;
        }
        else{
          move.DMG = Math.floor((Math.random() * 26) + 25);
          move.HIT_CHANCE = Math.floor((Math.random() * 26) + 75);
          move.BP = Math.floor((Math.random() * 26) + 25);
        }
      }
      selectedMoveNames.add(move.Description);  // Mark this move as selected
    }
  }

  // Select 1 random passive for the Battet based on rarity
  const availablePassives = randomBattet.passives[rarity];
  const selectedPassiveKey = getRandomElement(Object.keys(availablePassives));  // Randomly pick a passive
  const selectedPassive: { [key: string]: string } = {
    [selectedPassiveKey]: availablePassives[selectedPassiveKey]
  };

  // Create the simplified UserBattetData object
  const selectedBattet: UserBattetData = {
    name: randomBattet.name[rarity],  // Get name based on the rarity
    nick_name: randomBattet.nick_name,
    description: randomBattet.description[rarity],  // Get description based on rarity
    breed: randomBattet.breed,
    level: 1,  // Default level
    xp: 0,  // Starting XP
    xp_to_next_level: 100,  // Example XP threshold to next level
    price: Math.floor(Math.random() * 100) + 1,  // Random price between 1 and 100
    statusEffects: [],
    passives: selectedPassive,  // Use the selected passive
    type: randomBattet.type[rarity],  // Get type based on rarity
    weakness: randomBattet.weakness[rarity],
    stats: {
      MAXHP: maxHp,  
      HP: maxHp,
      MAXBP: maxBp,
      BP: maxBp,   // Randomized BP stat
      ATK: Math.floor((Math.random() * 51) + 50),  // Randomized ATK stat
      DEF: Math.floor((Math.random() * 26) + 75),  // Randomized DEF stat
      LOOKS: Math.floor((Math.random() * 51) + 50),  // Randomized LOOKS stat
    },
    moves: selectedMoves,
    selectedMoves: selectedMoves,  // Use the selected random moves
    image: randomBattet.image[rarity],  // Select image based on rarity
  };

  return selectedBattet;  // Return the simplified UserBattetData
}

// Function to get daily shop Battets
async function getDailyShopBattets(context: any, user: any, shopLength: number = 4): Promise<UserBattetData[]> {
  const shopKey = `${user.username}_${context.subredditName}_shop`;
  const shopTimerKey = `${user.username}_${context.subredditName}_shop_timer`;
  const currentTime = Date.now();

  try {
    console.log("Checking for existing shop data...");
    const [existingShopTimer, existingShopRaw] = await Promise.all([
      context.redis.get(shopTimerKey),
      context.redis.get(shopKey)
    ]);

    // If shop doesn't exist or timer has expired, create a new shop
    if (!existingShopTimer || !existingShopRaw || currentTime >= parseInt(existingShopTimer)) {
      console.log("Creating new shop data...");
      const shopBattets = Array.from({ length: shopLength }, createRandomBattet);
      const nextRefresh = currentTime + 24 * 60 * 60 * 1000; // 24 hours from now

      await Promise.all([
        context.redis.set(shopKey, JSON.stringify(shopBattets)),
        context.redis.set(shopTimerKey, nextRefresh.toString())
      ]);

      console.log("New shop data created and stored.");
      return shopBattets;
    }

    // If shop exists and timer is valid, return existing shop
    console.log("Returning existing shop data.");
    return JSON.parse(existingShopRaw);

  } catch (error) {
    console.error("Error in getDailyShopBattets:", error);
    return []; // Return an empty array as fallback
  }
}

async function updateBattetsInBackend(context:any, key:string, updatedBattets:any = null, isGet: boolean = false) {
  try {
    if(isGet){
      const battetsJson = await context.redis.get(key);
      return battetsJson ? JSON.parse(battetsJson) : [];
    }
    else {
      const battetsJson = JSON.stringify(updatedBattets);
      await context.redis.set(key, battetsJson);
    }
  }
  catch(error){
    console.error("Error updating Battets.");
    throw error;
  }
}

function moveHandler(userBattets: UserBattetData[], opponentBattets: UserBattetData[], battet: UserBattetData, opponent: UserBattetData, move: BattetMove, context: Devvit.Context) {
  let hit = opponent.stats.DEF < move.HIT_CHANCE || Math.random() > Math.random();
  let hits = 0;
  let halfUserHp = Math.floor(battet.stats.HP/2);
  let halfOpponentHp = Math.floor(opponent.stats.HP/2);
  let totalDmg = 0;
  let battleLog: string[] = [];
  let foundUserBattet = false;
  let foundOpponentBattet = false;
  const currentOpponentIndex = opponentBattets.findIndex(b => b.name === opponent.name);
  const currentUserIndex = userBattets.findIndex(b => b.name === battet.name);
  const uname = battet.name;
  const oname = opponent.name;
  const nextOpponent = opponentBattets[currentOpponentIndex + 1];
  const majorDmg = move.DMG * 4;

  Object.keys(battet.passives).forEach( passive => {
    switch(passive) {
      case "Fast":
        Object.values(battet.moves).forEach( move => {
          move.HIT_CHANCE += 50;
        });
        break;

      case "Poison_Affluent":
        if(battet.statusEffects.includes("poisoned")){
          battet.statusEffects = battet.statusEffects.filter(effect => effect !== "poisoned");
        }
        Object.values(opponent.moves).forEach( move => {
          if(move.TYPE.includes("Poison")){
            move.DMG = Math.floor(move.DMG/2);
          }
        });
        break;
      
      case "Birthed_in_Light":
        battet.stats.HP = Math.max(battet.stats.HP + 15, battet.stats.MAXHP);
        Object.values(opponent.moves).forEach( move => {
          if(move.TYPE.includes("Dark")){
            move.DMG = Math.floor(move.DMG/2);
          }
        });
        break;

      case "Overslept":
        if(battet.statusEffects.includes("asleep")){
          battet.statusEffects = battet.statusEffects.filter( effect => effect !== "asleep");
        }
        break;

      case "ElectricBody":
        if(!opponent.statusEffects.includes("paralyzed") && hit){
          if(Math.random() < 0.10){
            battleLog.push(`${uname}'s electric body has paralyzed ${oname}`);
            opponent.statusEffects.push("paralzyed");
          }
        }
        break;

      case "Unstable":
        if(hit){
          battleLog.push(`${uname}'s unstable nature increases damage`);
          move.DMG *= 2;
        }
        break;

      case "Light_source":
        if(battet.statusEffects.includes("blind")){
          battleLog.push(`${uname} is a source of light cannot be blinded`);
          battet.statusEffects = battet.statusEffects.filter(effect => effect !== "blind");
        }

        Object.values(opponent.moves).forEach(move => {
          if(move.TYPE.includes("Dark")){
            move.DMG = Math.floor(move.DMG/2);
          }
        });
        break;

      case "Explosive":
        Object.values(battet.moves).forEach(move => {
          if(move.TYPE.includes("Fire")){
            battleLog.push(`${uname} is explosive double damage`);
            move.DMG += 50;
          }
        });
        break;

      case "Overheated":
        if(move.TYPE.includes("Water")){
          move.DMG = Math.floor(move.DMG/2);
        }
        break;

      case "Seeds_of_Rejuvenation":
        if(battet.statusEffects.length === 0){
          battleLog.push(`${uname} sprouts seeds rejuvenating 25 health`);
          battet.stats.HP = Math.min(battet.stats.HP + 25, battet.stats.MAXHP);
        }
        break;

      case "Rebirth":
        if(Math.random() < .05){
          battleLog.push(`${uname} has been gifted a large amount of health`);
          battet.HP = Math.max(battet.stats.HP + 200 * battet.level, battet.stats.MAXHP);
        }
        break;

      case "Hardwired":
        if(battet.statusEffects.length !== 0){
          battet.statusEffects = battet.statusEffects.filter(effect => false);
        }
        break;

      case "Electric":
        if(hit){
          if(Math.random() < .3){
            battleLog.push(`${uname}'s electric body has paralyzed ${oname}`);
            opponent.statusEffects.push("paralyzed");
          }
        }
        break;

      case "Gluttonous":
        if(Object.keys(opponent.passives).length > 0){
          battleLog.push(`${uname}'s gluttony has stolen ${Object.keys(opponent.passives)[0]} from ${oname}`);
          battet.passives[Object.keys(opponent.passives)[0]] = opponent.passives[Object.keys(opponent.passives)[0]];
          delete opponent.passives[Object.keys(opponent.passives)[0]];
        }

        else{
          battleLog.push(`${oname} has no passives to steal`);
        }
        break;

      case "Quad_Attack":
        if(hit){
          battleLog.push(`${uname} does four times the damage`);
          move.DMG *= 4;
        }
        break;

      default:
        console.warn(`Unknown passive: ${passive}`);
    }
    
  });

  Object.keys(opponent.passives).forEach(passive => {
    switch(passive){
      case "Darkness_Birth":
        if(!hit){
          if(Math.random() > 0.5){
            hit = true;
          }
        }
        break;

      case "Sanctuary":
        if(Math.random() < .10){
          battleLog.push(`${oname}'s Sanctuary has nullified ${uname}'s ability`);
        }
        break;

      case "Magma_body":
        if(hit){
          move.DMG += 10;
        }
        break;
        
      default:
        console.warn(`Unknown passive: ${passive}`);
    }
  });

  let dmg = move.DMG;
  const hpDmg = Math.floor(dmg + opponent.stats.HP * Math.random());
  const halfDmg = Math.floor(dmg / 2);

  if(opponent.weakness && Array.isArray(opponent.weakness)){
    if(move.TYPE.some(type => opponent.weakness.includes(type))){
      if(hit && !move.TYPE.includes("Support")){
        battleLog.push(`${uname}'s attack does double damage due to ${oname}'s type`);
        dmg *= 2;
      }
    }

    if(move.TYPE.some(type => opponent.type.includes(type))){
      if(hit && !move.TYPE.includes("Support")){
        battleLog.push(`${uname}'s attack does half damage due to ${oname}'s type`);
        dmg = Math.floor(dmg / 2);
      }
    }
  }

  if(battet.statusEffects.includes("poisoned")){
    if(Math.random() > Math.random()){
      battleLog.push(`${uname} has taken poison damage`);
      battet.stats.HP = Math.max(battet.stats.HP - 10, 0);
    }

    else{
      battleLog.push(`${uname} is no longer poisoned!`);
      battet.statusEffects = battet.statusEffects.filter(effect => effect !== "poisoned");
    }
  }

  if(battet.statusEffects.includes("burned")){
    if(Math.random() > Math.random()){
      battleLog.push(`${uname} has taken fire damage from being burned`);
      battet.stats.HP = Math.max(battet.stats.HP - 10, 0);
    }

    else{
      battleLog.push(`${uname} is no longer burned!`);
      battet.statusEffects = battet.statusEffects.filter(effect => effect !== "burned");
    }
  }

  if(opponent.statusEffects.includes("reflective")){
    if(Math.random() > Math.random()){
      if(!move.TYPE.includes("Support")){
        battleLog.push(`${uname} has taken reflective damage`);
        battet.stats.HP = Math.max(battet.stats.HP - move.DMG, 0);
      }
    }
    else{
      battleLog.push(`${oname} is no longer protected with a reflective shield`);
      opponent.statusEffects = opponent.statusEffects.filter(effect => effect !== "reflective");
    }
  }

  if(opponent.statusEffects.includes("reflectivefire")){
    if(Math.random() > Math.random()){
      if(!move.TYPE.includes("Support")){
        battleLog.push(`${uname} has taken reflective damage`);
        battet.stats.HP = Math.max(battet.stats.HP - move.DMG, 0);
        if(Math.random() < 0.1 && !opponent.statusEffects.includes("burned")){
          battleLog.push(`${oname}'s shield of flame have burned ${uname}`);
          battet.statusEffects.push("burned");
        }
      }
    }
    else{
      battleLog.push(`${oname} is no longer protected with a reflective flame shield`);
      opponent.statusEffects = opponent.statusEffects.filter(effect => effect !== "reflectivefire");
    }
  }

  if(battet.statusEffects.includes("electroorb")){
    if(Math.random() > Math.random()){
      battleLog.push(`${uname} has taken electric damage`);
      battet.stats.HP = Math.max(battet.stats.HP - 10, 0);
    }

    else{
      battleLog.push(`${oname}'s electric orb has ceased to exist!`);
      battet.statusEffects = battet.statusEffects.filter(effect => effect !== "electroorb");
    }
  }

  if(battet.statusEffects.includes("blind")){
    if(Math.random() > Math.random()){
      move.HIT_CHANCE = Math.max(move.HIT_CHANCE - 20, 5);
    }
    else{
      battleLog.push(`${uname} can see again!`);
      battet.statusEffects = battet.statusEffects.filter(effect => effect !== "blind");
    }
  }

  if(battet.statusEffects.includes("electricdrained")){
    if(Math.random() > Math.random()){
      if(move.TYPE.includes("Electric")){
        battleLog.push(`${uname} cannot do electric moves`);
        return {userBattets, opponentBattets, battet, opponent, battleLog};
      }
    }
    else{
      battleLog.push(`${uname} is no longer drained of electric energy!`);
      battet.statusEffects = opponent.statusEffects.filter(effect => effect !== "electricdrained");
    }
  }

  if(opponent.statusEffects.includes("electricimmune")){
    if(Math.random() > Math.random()){
      if(move.TYPE.includes("Electric")){
        battleLog.push(`${oname} is immune to electric attacks`);
        return {userBattets, opponentBattets, battet, opponent, battleLog};
      }
    }
    else{
      battleLog.push(`${oname}'s electric shields are down!`);
      opponent.statusEffects = opponent.statusEffects.filter(effect => effect !== "electricimmune");
    }
  }

  if(opponent.statusEffects.includes("burrowed")){
    battleLog.push(`${oname} has become unburrowed`);
    opponent.statusEffects = opponent.statusEffects.filter(effect => effect !== "burrowed");
    if(!move.TYPE.includes("Ground")){
      battleLog.push(`${oname} is deep underground`);
      return {userBattets, opponentBattets, battet, opponent, battleLog};
      }
    
  }

  if(battet.statusEffects.includes("entangled")){
    if(Math.random() > Math.random()){
      battleLog.push(`${uname} is entangled`);
      return {userBattets, opponentBattets, battet, opponent, battleLog};
     }
  
    else{
      battleLog.push(`${uname} is no longer entangled!`);
      battet.statusEffects = battet.statusEffects.filter(effect => effect !== "entangled");
    }
  }

  if(battet.statusEffects.includes("asleep")){
    if(Math.random() > Math.random()){
      battleLog.push(`${uname} is sleeping`);
      return {userBattets, opponentBattets, battet, opponent, battleLog};
     }
  
    else{
      battleLog.push(`${uname} woke up!`);
      battet.statusEffects = battet.statusEffects.filter(effect => effect !== "asleep");
    }
  }

  if(battet.statusEffects.includes("paralyzed")){
    if(Math.random() > Math.random()){
      battleLog.push(`${uname} is paralyzed`);
      return {userBattets, opponentBattets, battet, opponent, battleLog};
     }
  
    else{
      battleLog.push(`${uname} is no longer paralyzed!`);
      battet.statusEffects = battet.statusEffects.filter(effect => effect !== "paralyzed");
    }
  }

  if(battet.statusEffects.includes("charmed")){
    if(Math.random() > Math.random()){
      battleLog.push(`${uname} is charmed`);
      return {userBattets, opponentBattets, battet, opponent, battleLog};
     }
  
    else{
      battleLog.push(`${uname} is no longer charmed!`);
      battet.statusEffects = battet.statusEffects.filter(effect => effect !== "charmed");
    }
  }

  if(Math.random() < 0.05 && !move.TYPE.includes("Support")){
    if(hit && !move.TYPE.includes("Support")){
      battleLog.push(`${uname}'s attack hit a critical spot double damage!`);
      move.DMG *= 2;
    }
  }

  if (battet.stats.BP < move.BP) {
    battleLog.push(`${uname} does not have enough BP, recharging BP`);
    battet.stats.BP = Math.min(battet.stats.BP += 20, battet.stats.MAXBP);
  } 
  
  else {
    switch (move.MoveCase) {
      case 0:
        if (hit) {
          battleLog.push(`${uname} punched ${oname} for ${dmg} damage`);
          battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
          opponent.stats.HP = Math.max(opponent.stats.HP - dmg, 0);
        } 
        else {
          battleLog.push(`${uname} went for a punch and missed :(`);
        }
        break;
      case 1:
        if (hit) {
          battleLog.push(`${uname} kicked ${oname} for ${dmg} damage`);
          battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
          opponent.stats.HP = Math.max(opponent.stats.HP - dmg, 0);
        } 
        else {
          battleLog.push(`${uname} went for a kick and missed :(`);
        }
        break;
      case 2:
        battleLog.push(`${uname} conjures a shield of water rasing defense`);
        battet.stats.DEF += 20;
        battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
        break;
      case 3:
        for(let i = 0; i < 3; i++){
          if(Math.random() > Math.random()){
            totalDmg += move.DMG;
            hits += 1;
          }
        }
        if(hits >= 1){
          battleLog.push(`${uname} shot three jets of water out, hitting ${oname} ${hits} times doing a total of ${totalDmg}`);
          opponent.stats.HP = Math.max(opponent.stats.HP -= totalDmg, 0);
          battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
        }
        else{
          battleLog.push(`${uname} shot three jets of water out, but forgot the H and double O's`);
        }
        break;
      case 4:
        if(!opponent.statusEffects.includes("poisoned")){
          battleLog.push(`${uname} lets out a purple mist poisoning ${oname}`);
          battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
          opponent.statusEffects.push("poisoned");
        }
        else{
          battleLog.push(`${oname} is already poisoned`);
        }
        break;
      case 5:
        [battet, opponent].forEach(player => {
          Object.values(player.moves).forEach(move => {
            if (move.TYPE.includes('Dark') && !move.TYPE.includes('Support')) {
              dmg += 20;
              }
            });
          });
        opponent.statusEffects.push("blind");
        battleLog.push(`${uname} casts Darkness, boosting all offensive Dark moves and reducing accuracy of non-Dark moves!`);
        battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);       
        break;
      case 6:
        if (hit) {
          battleLog.push(`${uname} conjured a lance of shadow throwing it at ${oname} for ${dmg} damage`);
          battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
          opponent.stats.HP = Math.max(opponent.stats.HP - dmg, 0);
        } 
        else {
          battleLog.push(`${uname} went to conjure a lance of shadow, but forgot what a lance looked like :(`);
        }
        break;
      case 7:
        if(Math.random()*opponent.stats.HP < 50) {
          battleLog.push(`${uname}'s withers ${oname} their flesh starts breaking dealing ${hpDmg} damage!`);
          opponent.stats.HP = Math.floor(Math.max(opponent.stats.HP - move.DMG + opponent.stats.HP * Math.random(), 0));
          battet.stats.BP = Math.max(battet.stats.BP - move.BP, 5);
        } 
        else {
          battleLog.push(`${uname} attempted to Wither ${oname}'s spirit instead they played the Witcher.`);
        }
        break;
      case 8:
        if (hit) {
          battleLog.push(`${uname} took to the air with a bright flash reducing ${oname}'s accuracy and hitting ${oname} for ${dmg} damage`);
          Object.values(opponent.moves).forEach(move => {
            move.HIT_CHANCE = Math.max(move.HIT_CHANCE - 20, 5);
          });
          battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
          opponent.stats.HP = Math.max(opponent.stats.HP - dmg, 0);
        } 
        else {
          battleLog.push(`${uname} tried to take a celestial flight, took the bus instead :(`);
        }
        break;
      case 9:
        if (hit) {
          battleLog.push(`${uname} slashed across ${oname}'s chest for ${dmg} damage and casuing it to bleed.`);
          if(!opponent.statusEffects.includes("bleeding")){
            opponent.statusEffects.push("bleeding");
          }
          battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
          opponent.stats.HP = Math.max(opponent.stats.HP - dmg, 0);
        } 
        else {
          battleLog.push(`${uname} tried to slash ${oname} instead gave them a sash.`);
        }
        break;
      case 10:
        if(!battet.statusEffects.includes("reflective")){
          battleLog.push(`${uname} calls forth an aura of protection reflecting damage back at ${oname}.`);
          battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
          battet.statusEffects.push("reflective");
        }
        else{
          battleLog.push(`${uname} is already coated with protection`);
        }
        break;
      case 11:
        if (hit) {
          battleLog.push(`${uname} calls forth a smite on ${oname} for ${dmg} damage`);
          opponent.stats.HP = Math.max(opponent.stats.HP - dmg, 0);
          if(currentOpponentIndex != -1 && currentOpponentIndex < opponentBattets.length - 1){
            battleLog.push(`${uname}'s smite also affected ${nextOpponent.name} for ${halfDmg} damage`);
            nextOpponent.stats.HP = Math.max(nextOpponent.stats.HP - halfDmg, 0);
          }
          battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
        } 
        
        else {
          battleLog.push(`${uname} called forth a smite, but forgot to say please :(`);
        }
        break;
      case 12:
        if(Math.random() > Math.random()){
          battleLog.push(`${uname} soothes ${oname} gently to sleep`);
          if(!opponent.statusEffects.includes("asleep")){
            battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
            opponent.statusEffects.push("asleep");
          }
          else{
            battleLog.push(`${oname} is already asleep`);
          }
        }
        else{
          battleLog.push(`${uname} tried to soothe ${oname} to sleep, but forgot the milk :(`);
        }
        break;
      case 13:
        battleLog.push(`${uname} flies high into the sky decreasing accuracy for ${oname}`);
        battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
        Object.values(opponent.moves).forEach(move => {
          move.HIT_CHANCE = Math.max(move.HIT_CHANCE - 10, 5);
        });
        break;
      case 14:
        if (battet.stats.LOOKS > opponent.stats.LOOKS && Math.random() > 0.1) {
          battleLog.push(`${uname} charms ${oname}`);
          if(!opponent.statusEffects.includes("charmed")){
            battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
            opponent.statusEffects.push("charmed");
          }
          else{
            battleLog.push(`${oname} is already charmed`)
          }  
        } 
        else {
          battleLog.push(`${uname} tried to charm ${oname} then farted :(`);
        }
        break;
      case 15:
        if (hit) {
          battleLog.push(`${uname} pushes ${oname} for ${dmg} damage`);
          battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
          opponent.stats.HP = Math.max(opponent.stats.HP - dmg, 0);
          if(Math.random() < 0.1){
            battleLog.push(`${oname} has lost balance due to being pushed, -5 accuracy`)
            Object.values(opponent.moves).forEach(move => {
              move.HIT_CHANCE = Math.max(move.HIT_CHANCE - 5, 5);
            });
          }
        } 
        else {
          battleLog.push(`${uname} tried to push ${oname}, unfortunately ${oname} is a pull`);
        }
        break;
      case 16:
        hits = 0;
        totalDmg = 0;
        for(let i = 0; i < 3; i++){
          if(Math.random() > Math.random()){
            hits += 1;
            totalDmg += move.DMG;
          }
        }
        if(hits >= 1){
          battleLog.push(`${uname} shoots ${hits} electrical rays doing a total of ${totalDmg} damage`);
          battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
          opponent.stats.HP = Math.max(opponent.stats.HP - dmg, 0);
          for(let i = 0; i < hits; i++){
            if(Math.random() > 0.3 && !opponent.statusEffects.includes("paralyzed")){
              battleLog.push(`${oname} has been paralyzed by one of the rays.`);
              opponent.statusEffects.push("paralyzed");
            }
          }
        }
        else{
          battleLog.push(`${uname} had ${hits} chances and blew it :(`);
        }
        break;
      case 17:
        if(Math.random() > Math.random()){
          if(!opponent.statusEffects.includes("paralyzed")){
            battleLog.push(`${uname} let's out rays that paralyzes ${oname}`);
            opponent.statusEffects.push("paralyzed");
            battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
          }
          else{
            battleLog.push(`${oname} is already paralzed`);
          }
        }
        else{
          battleLog.push(`${uname} tried to paralze ${oname}, but grew a concious :)`);
        }
        break;
      case 18:
        battleLog.push(`${uname} lets out a large pulse lowering ${oname}'s defense by 20`);
        opponent.stats.DEF = Math.max(opponent.stats.DEF - 20, 0);
        battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
        if(Math.random() > 0.5){
          if(!opponent.statusEffects.includes("paralyzed")){
            battleLog.push(`${oname} was paralzyed by the pulse`);
            opponent.statusEffects.push("paralyzed");
          }
        }
        break;
      case 19:
        if(!opponent.statusEffects.includes("paralyzed")){
          battleLog.push(`${uname} unleashes a paralyzing field that paralyzes ${oname}`);
          opponent.statusEffects.push("paralzyed");
          battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
        }
        else{
          battleLog.push(`${oname} is already paralzyed`);
        }
        if(currentOpponentIndex != -1 && currentOpponentIndex < opponentBattets.length - 1 && !nextOpponent.statusEffects.includes("paralyzed")){
          battleLog.push(`The paralyzing field has also paralyzed ${nextOpponent.name}`);
          nextOpponent.statusEffects.push("paralyzed");
        }
        break;
      case 20:
        if(!opponent.statusEffects.includes("electroorb")){
          battleLog.push(`${uname} unleashes an electrical orb on the field that does damage while active`);
          opponent.statusEffects.push("electroorb");
          battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
        }
        else{
          battleLog.push("Lasting Orb is already active");
        }
        break;
      case 21:
        battleLog.push(`${uname} has nullified all their status effects`);
        battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
        battet.statusEffects = [];
        break;
      case 22:
        if (hit) {
          battleLog.push(`${uname} has conjured a column of lightning damaging ${oname} for ${dmg} as well as healing ${uname} for ${dmg}`);
          battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
          opponent.stats.HP = Math.max(opponent.stats.HP - dmg, 0);
          battet.stats.HP = Math.min(battet.stats.HP + dmg, battet.stats.MAXHP);
        } 
        else {
          battleLog.push(`${uname} conjured a column of thunder, it was loud.`);
        }
        break;
      case 23:
        battleLog.push(`${uname} coats ${oname} in smoke lowering their accuracy`);
        battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
        opponent.statusEffects.push("blind");
        break;
      case 24:
        if (hit) {
          battleLog.push(`group of ${uname} rapidly move up and down popping magma at ${oname} for ${dmg} damage`);
          battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
          opponent.stats.HP = Math.max(opponent.stats.HP - dmg, 0);
          if(Math.random() < 0.3 && !opponent.statusEffects.includes("burned")){
            battleLog.push(`The magma has burned ${oname}`);
            opponent.statusEffects.push("burned");
          }
        } 
        else {
          battleLog.push(`group of ${uname} rapidly move up and down popping magma into their mouths yummy :)`);
        }
        break;
      case 25:
        if(!battet.statusEffects.includes("burrowed")){
          battleLog.push(`group of ${uname} burrow deep into the magma covered ground`);
          battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
          battet.statusEffects.push("burrowed");
        }
        else{
          battleLog.push(`group of ${uname} refuse to burrow based on Worker's Rights`);
        }
        break;
      case 26:
        if (hit) {
          battleLog.push(`group of ${uname} melt the area including themselves dealing ${majorDmg} to ${oname} and suffering ${halfUserHp} damage themselves`);
          battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
          battet.stats.HP = Math.max(battet.stats.HP - halfUserHp, 0);
          opponent.stats.HP = Math.max(opponent.stats.HP - majorDmg, 0);
        } 
        else {
          battleLog.push(`group of ${uname} are currently on Holiday, please come back later :)`);
        }
        break;
      case 27:
        if (hit) {
          battleLog.push(`${uname} shoots a blast of fire at ${oname} for ${dmg} damage`);
          battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
          opponent.stats.HP = Math.max(opponent.stats.HP - dmg, 0);
          if(Math.random() > 0.5 && !opponent.statusEffects.includes("burned")){
            battleLog.push(`The blast of fire has left ${oname} burned`);
            opponent.statusEffects.push("burned");
          }
        } 
        else {
          battleLog.push(`${uname} shot a blast of fire, wrong end though :(`);
        }
        break;
      case 28:
        if (hit) {
          battleLog.push(`${uname} shot forth flaming vines entangling ${oname} and hitting for ${dmg} damage`);
          battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
          opponent.stats.HP = Math.max(opponent.stats.HP - dmg, 0);
          if(!opponent.statusEffects.includes("entangled")){
            battleLog.push(`${oname} is now entangled in flaming vines`);
            opponent.statusEffects.push("entangled");
            if(Math.random() < 0.3 && !opponent.statusEffects.includes("burned")){
              battleLog.push(`${oname} has been burned by the flaming vines`);
              opponent.statusEffects.push("burned");
            }
          }
        } 
        else {
          battleLog.push(`${uname} shot flaming vines out, but decided to attack a squirrel instead :(`);
        }
        break;
      case 29:
        if(!battet.statusEffects.includes("reflectivefire")){
          battleLog.push(`${uname} has conjured a shield of fire around them reflecting physical damage with a chance to burn`);
          battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
          battet.statusEffects.push("reflectivefire");
        }
        else{
          battleLog.push(`The shields of flame already surround ${uname}`);
        }
        break;
      case 30:
        for(let i = 0; i < 3; i++){
          if(Math.random() > Math.random()){
            hits += 1;
            totalDmg += move.DMG + Math.floor((Math.random() * 100));
          }
        }
        if(hits >= 1){
          battleLog.push(`${uname} sends 3 burning seeds out, ${hits} pop near ${oname} dealing ${totalDmg} damage`);
          battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
          opponent.stats.HP = Math.max(opponent.stats.HP - totalDmg, 0);
        }
        else{
          battleLog.push(`${uname} was going to pop seeds but they saw something special in one, perhaps sesame?`);
        }
        break;
      case 31:
        if (hit) {
          battleLog.push(`${uname} releases it's outer shield of flame, hitting ${oname} for ${dmg} damage and revealing it's hardened bark core def raised by 20`);
          battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
          battet.stats.DEF += 20;
          opponent.stats.HP = Math.max(opponent.stats.HP - dmg, 0);
        } 
        else {
          battleLog.push(`${uname} unleashed it's flames to the winds where they belong doing no damage. Their hardened wooden core is exposed Def +20`);
          battet.stats.DEF += 20;
          battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
        }
        break;
      case 32:
        if (hit) {
          battleLog.push(`${uname} attacked ${oname}'s mind for ${dmg} damage, ${oname} feels weaker -10 to all stats`);
          battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
          opponent.stats.HP = Math.max(opponent.stats.HP - dmg, 0);
          Object.values(opponent.stats).forEach( stat => {
            stat = Math.max(stat -= 10, 5);
          });
        } 
        else {
          battleLog.push(`${uname} will not enter ${oname}'s mind they seem too cool`);
        }
        break;
      case 33:
        for(let i = 0; i < 5; i++){
          if(Math.random() > Math.random()){
            hits += 1;
            totalDmg += dmg;
          }
        }
        if (hits >= 1){
          battleLog.push(`A solar storm conjures around ${uname} hitting ${oname} ${hits} times for a total of ${totalDmg}`);
          battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
          opponent.stats.HP = Math.max(opponent.stats.HP - dmg, 0);
          for(let i = 0; i < hits; i++){
            if(Math.random() > Math.random() && !opponent.statusEffects.includes("burned")){
              battleLog.push(`${oname} has been burned by the solar storm`);
              opponent.statusEffects.push("burned");
            }
          }
        }
        else{
          battleLog.push(`${uname} had 5 attempts and ${oname} dodged it like a champ`);
        }
        break;
      case 34:
        if (hit) {
          battleLog.push(`${uname} springs their vines forward grabbing ${oname} for ${dmg} damage, ${oname} is entangled`);
          battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
          opponent.stats.HP = Math.max(opponent.stats.HP - dmg, 0);
          if(!opponent.statusEffects.includes("entangled")){
            opponent.statusEffect.push("entangled");
          }
        } 
        else {
          battleLog.push(`${uname} spring their vines towards ${oname}, but decided against it for unknown reasons`);
        }
        break;
      case 35:
        battleLog.push(`${uname} stabalizes itself increasing accuracy and removing ${battet.statusEffects[0]}`);
        battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
        delete battet.statusEffects[0];
        Object.values(battet.moves).forEach( move => {
          move.HIT_CHANCE += 10;
        });    
        break;
      case 36:
        if (hit) {
          battleLog.push(`${uname} short circuited sending a rogue spark too ${oname} for ${dmg} damage`);
          battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
          opponent.stats.HP = Math.max(opponent.stats.HP - dmg, 0);
          if(Math.random() > Math.random() && !opponent.statusEffects.includes("paralzyed")){
            battleLog.push(`${oname} was paralyzed due to the short circuit`)
            opponent.statusEffects.push("paralyzed");
          }
        } 
        else {
          battleLog.push(`${uname} ran optimally! :)`);
        }
        break;
      case 37:
        if (hit) {
          battleLog.push(`${uname} charges at ${oname} for ${dmg} damage`);
          battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
          opponent.stats.HP = Math.max(opponent.stats.HP - dmg, 0);
          if(Math.random() > Math.random()){
            battleLog.push(`${oname} was knocked off balance -5 to accuracy`);
            Object.values(opponent.moves).forEach( move => {
              move.HIT_CHANCE = Math.max(move.HIT_CHANCE - 5, 5);
            });
          }
        } 
        else {
          battleLog.push(`${uname} charged their battery`);
        }
        break;
      case 38:
        battleLog.push(`${uname} is charging their shields defense +20`);
        battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
        battet.stats.DEF += 20;
        break;
      case 39:
        if (hit) {
          battleLog.push(`${uname} summoned a stream of thunder shocking ${oname} for ${dmg*2} damage and paralyzing them`);
          battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
          opponent.stats.HP = Math.max(opponent.stats.HP - dmg, 0);
          opponent.statusEffects.push("paralysis");
        } 
        else {
          battleLog.push(`${uname} WILL NOT SHOCK FOR YOU`);
        }
        break;
      case 40:
        if (hit) {
          battleLog.push(`coated in poison ${uname} charges at ${oname} for ${dmg} damage`);
          battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
          opponent.stats.HP = Math.max(opponent.stats.HP - dmg, 0);
          if(Math.random() > Math.random()){
            battleLog.push(`${oname} was poisoned by the charge`);
            opponent.statusEffects.push("poisoned");
          }
          if(Math.random() > Math.random()){
            battleLog.push(`${oname} was knocked off balance from the charge accuracy - 10`);
            Object.values(opponent.moves).forEach( move => {
              move.HIT_CHANCE = Math.max(move.HIT_CHANCE - 10, 5);
            });
          }
        } 
        else {
          battleLog.push(`${uname} followed Zorro`);
        }
        break;
      case 41:
        if(!opponent.statusEffects.includes("paralyzed")){
          battleLog.push(`${uname} shoots a ray of electric energy paralyzing ${oname}`);
          battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
          opponent.statusEffects.push("paralyzed");
        }
        else {
          battleLog.push(`${oname} is already paralyzed`);
        }
        break;
      case 42:
        if (!battet.statusEffects.includes("electricimmune")) {
          battleLog.push(`${uname} drains electrical energy from the area creating a barrier to elecrical moves`);
          battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
          battet.statusEffects.push("electricimmune");
        } 
        else {
          battleLog.push(`${uname} is already immune to electric damage`);
        }
        if (!opponent.statusEffects.includes("electricdrained") && opponent.type.includes("Electric")){
          battleLog.push(`${oname} can no longer do electric attacks`);
          battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
          opponent.statusEffects.push("electricdrained");
        }
        else {
          if (!opponent.type.includes("Electric")){
            battleLog.push(`${oname} is not electric type so was not drained`);
          }
          else{
            battleLog.push(`${oname} is already being drained of electrical abilities`);
          }
        }
        break;
      case 43:
        if (hit) {
          battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
          while(!foundOpponentBattet){
            for (let i = 0; i < opponentBattets.length; i++){
              if (opponentBattets[i].type.includes("Mech")){
                battleLog.push(`${opponentBattets[i].name}'s health has been reduced to 1`);
                opponentBattets[i].stats.HP = 1;
                foundOpponentBattet = true;
                break;
              }
            }
            if(!foundOpponentBattet){
              battleLog.push("No mech Battet's in opponent's party");
              break;
            }
          }
        } 
        else {
          battleLog.push(`${uname} is questioning the idea of free will`);
        }
        break;
      case 44:
        if (hit) {
          battleLog.push(`${uname} shot a wave of dark energy at ${oname} for ${dmg} damage and lowering their defense by 25`);
          battet.stats.BP = Math.max(battet.stats.BP - move.BP, 0);
          opponent.stats.HP = Math.max(opponent.stats.HP - dmg, 0);
          opponent.stats.DEF = Math.max(opponent.stats.DEF - 25, 5);
        } 
        else {
          battleLog.push(`${oname} dodged ${uname}'s blast with ease`);
        }
        break;
      case 45:
        battet.stats.BP -= move.BP;
        if(Math.random() > Math.random()){
          battleLog.push(`${uname} absorbed a majority of health`)
          battet.stats.HP = Math.min(battet.stats.HP + 50, battet.stats.MAXHP);
          battet.stats.BP = Math.min(battet.stats.BP + 5, battet.stats.MAXBP);
          battet.stats.DEF += 5;
          battet.stats.ATK += 5;
          opponent.stats.HP = Math.max(opponent.stats.HP - 50, 0);
          opponent.stats.BP = Math.max(opponent.stats.BP - 5, 0);
          opponent.stats.DEF = Math.max(opponent.stats.DEF - 5, 0);
          opponent.stats.ATK = Math.max(opponent.stats.ATK - 5, 0);
        }
        else{
          battleLog.push(`${uname} absorbed a majority of stats`)
          battet.stats.HP = Math.min(battet.stats.HP + 5, battet.stats.MAXHP);
          battet.stats.BP = Math.min(battet.stats.BP + 25, battet.stats.MAXBP);
          battet.stats.DEF += 25;
          battet.stats.ATK += 25;
          opponent.stats.HP = Math.max(opponent.stats.HP - 5, 0);
          opponent.stats.BP = Math.max(opponent.stats.BP - 25, 0);
          opponent.stats.DEF = Math.max(opponent.stats.DEF - 25, 0);
          opponent.stats.ATK = Math.max(opponent.stats.ATK - 25, 0);
        }
        break;
      default:
        battleLog.push("Unknown move");
    }
  }
  return {userBattets, opponentBattets, battet, opponent, battleLog};
}

function levelUp(battet: UserBattetData){
  Object.keys(battet.passives).forEach(passive => {
    switch(passive){
      case "Sturdy":
        battet.stats.MAXHP += 5;
        break;

      case "Pillow":
        battet.stats.DEF += 5;
        break;

      case "Grumpy":
        battet.stats.ATK += 5;
        break;

      case "Plating":
        battet.stats.BP += 5;
        break;

      case "Scanners":
        Object.values(battet.moves).forEach( move => {
          move.HIT_CHANCE += 10;
        });
        break;

      default:
        console.warn(`Unknown passive ${passive}`);
    }
  });

  Object.values(battet.moves).forEach( move => {
    move.HIT_CHANCE += 5;
    move.DMG += 5;
    move.BP = Math.max(move.BP - 5, 5);
  });

  battet.stats.MAXHP += 10;
  battet.stats.HP = battet.MAXHP;
  battet.stats.MAXBP += 10;
  battet.stats.BP = battet.MAXBP;
  battet.stats.ATK += 10;
  battet.stats.DEF += 10;
  battet.stats.LOOKS += 10;
  battet.statusEffects = [];

  battet.level += 1;
  battet.xp = 0;
  battet.xp_to_next_level = 100 + (battet.level - 1) * 50;
  
}

function formatDisplay(
  data: Record<string, any> | string[],
  spacing_sep: string,
  isDict: boolean = false,
  orderedKeys?: string[],
  isMovesList: boolean = false,
  replacements: [string, string][] = []
): string {
  const applyReplacements = (str: string) => {
    return replacements.reduce((acc, [from, to]) => acc.replace(new RegExp(from, 'g'), to), str);
  };

  if (Array.isArray(data)) {
    return data.map(applyReplacements).join(spacing_sep);
  }

  if (isDict) {
    const entries = orderedKeys 
      ? orderedKeys.map(key => [key, data[key]])
      : Object.entries(data);

    return entries
      .map(([key, value]) => {
        const formattedKey = applyReplacements(key);
        if (isMovesList && typeof value === 'object' && value.Description) {
          return `${formattedKey}: ${value.Description}`;
        }
        return `${formattedKey}: ${value}`;
      })
      .filter(entry => !entry.endsWith(': undefined'))
      .join(spacing_sep);
  }

  return '';
}

// Weekly Battet scheduler job
Devvit.addSchedulerJob({
  name: 'weeklyBattetGiveaway',
  onRun: async (event, context) => {
    const nextResetTimestamp = await context.redis.get('nextWeeklyBattetReset');
    const now = new Date().getTime();

    if (!nextResetTimestamp || now >= parseInt(nextResetTimestamp)) {
      // It's time to reset the weekly Battet
      const weeklyBattet = createRandomBattet();  // Use your existing function
      await context.redis.set('weeklyBattet', JSON.stringify(weeklyBattet));
      
      // Reset the list of users who have claimed the Battet
      await context.redis.del('weeklyBattetClaims');

      // Set the next reset time (7 days from now)
      const nextReset = new Date(now + 7 * 24 * 60 * 60 * 1000);
      await context.redis.set('nextWeeklyBattetReset', nextReset.getTime().toString());
    }
  },
});

// Initial setup to start the weekly cycle
Devvit.addTrigger({
  event: 'AppInstall',
  onEvent: async (event, context) => {
    await context.scheduler.runJob({
      name: 'scheduleWeeklyBattetGiveaway',
      runAt: new Date(), // Run immediately to start the cycle
    });
  },
});

Devvit.addCustomPostType({
  name: 'RedditBattets',
  height: 'tall',
  render: (context) => {
    const [currentView, setCurrentView] = useState<'menu' | 'shop' | 'battle' | 'help'>('menu');

    // Shop state and logic
    const [currentBattetIndex, setCurrentBattetIndex] = useState(0);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [nextRefresh, setNextRefresh] = useState(0);

    // Battle state and logic
    const [battleState, setBattleState] = useState<'idle' | 'initializing' | 'playerTurn' | 'enemyTurn' | 'victory' | 'defeat'>('idle');
    const [playerBattet, setPlayerBattet] = useState<UserBattetData | null>(null);
    const [enemyBattet, setEnemyBattet] = useState<UserBattetData | null>(null);
    const [battleLog, setBattleLog] = useState<string[]>([]);
    const [postCreator, setPostCreator] = useState<string | null>(null);
    const [battleInitialized, setBattleInitialized] = useState(false);
    const [rounds, setRounds] = useState(1);

    // Main menu render
    if (currentView === 'menu') {
      return (
        <vstack gap="large" alignment="center middle" backgroundColor="white" padding="large">
          <text size="xxlarge" weight="bold" color="black">Reddit Battets</text>
            <vstack gap="medium" alignment="center middle">
              <button
                onPress={() => setCurrentView('shop')}
                appearance="secondary"
                size="large"
                grow
              >
                Visit Shop
              </button>
              <button
                onPress={() => setCurrentView('battle')}
                appearance="secondary"
                size="large"
                grow
              >
                Battle Wild Battets
              </button>
            </vstack>
            <vstack gap="medium" alignment="center middle">
              <button
                appearance="secondary"
                size="large"
                icon="users"
                disabled
              >
                Battle Redditors (Coming Soon)
              </button>
              <button
                onPress={() => setCurrentView('help')}
                appearance="secondary"
                size="large"
                icon="help"
                grow
              >
                Help
              </button>
            </vstack>
        </vstack>
      );
    }

    // Shop render
    if (currentView === 'shop') {
      const { data: userData, loading: userLoading, error: userError } = useAsync(async () => {
        const user = await context.reddit.getCurrentUser();
        if (!user) {
          throw new Error("Failed to fetch current user");
        }
  
        const coins = await getOrInitializeUserCoins(context, user);
  
        return { username: user.username, bananaCount: coins };
      });
  
      // Separate useAsync for fetching battets
      const { data: shopBattets, loading: battetsLoading, error: battetsError } = useAsync(async () => {
        const user = await context.reddit.getCurrentUser();
        if (!user) {
          throw new Error("Failed to fetch current user for battets");
        }
        const fetchedBattets = await getDailyShopBattets(context, user);
        console.log("Length: ", fetchedBattets.length);
  
        if (!Array.isArray(fetchedBattets)) {
          throw new Error("No battets received or empty array.");
        }
  
        return fetchedBattets;
      });
  
      // useInterval for updating time until refresh
      useInterval(async () => {
        try {
          const user = await context.reddit.getCurrentUser();
          if (user) {
            const shopTimerKey = `${user.username}_${context.subredditName}_shop_timer`;
            const [battets, nextRefreshStr] = await Promise.all([
              getDailyShopBattets(context, user),
              context.redis.get(shopTimerKey)
            ]);
  
            console.log("Fetched shopTimerKey:", nextRefreshStr);
  
            const newNextRefresh = nextRefreshStr ? parseInt(nextRefreshStr) : 0;
            setNextRefresh(newNextRefresh);
  
            const now = Date.now();
            const remaining = Math.max(0, newNextRefresh - now);
            setTimeRemaining(remaining);
          }
        } catch (error) {
          console.error("Error refreshing shop:", error);
        }
      }, 60000).start();
  
  
      // Handling loading, error, and no data
      if (userLoading || battetsLoading) return <text>Loading...</text>;
      if (userError) return <text>Error loading user data: {userError.message}</text>;
      if (battetsError) return <text>Error loading battets: {battetsError.message}</text>;
      if (!userData || !shopBattets) return <text>No data available</text>;
  
      // Handling battet switching and purchasing
      const currentBattet = shopBattets[currentBattetIndex];
      const selectedImage = currentBattet?.image?.[0];
  
      const nextBattet = () => {
        setCurrentBattetIndex((prevIndex) => (prevIndex + 1) % shopBattets.length);
      };
  
      const prevBattet = () => {
        setCurrentBattetIndex((prevIndex) => (prevIndex - 1 + shopBattets.length) % shopBattets.length);
      };
  
      const purchaseBattet = async () => {
        setIsPurchasing(true);
        try {
          const user = await context.reddit.getCurrentUser();
          if (!user) {
            throw new Error("Failed to fetch current user");
          }
          const userKey = `${user.username}_${context.subredditName}`;
          const shopKey = `${userKey}_shop`;
          const battetsKey = `${userKey}_battets`;
          const coinsKey = `${userKey}_coins`;
      
          // Get current user's coins
          let coins = await getOrInitializeUserCoins(context, user);
      
          // Get current shop battets
          const shopBattets = await updateBattetsInBackend(context, shopKey, null, true);
      
          // Get the battet to purchase
          const battetToPurchase = shopBattets[currentBattetIndex];
          
          if (coins < battetToPurchase.price) {
            context.ui.showToast(`Not enough Bananas to purchase ${battetToPurchase.name}`);
            return;
          }
      
          // Deduct the price from user's coins
          coins -= battetToPurchase.price;
      
          // Get current user's battets
          const userBattets = await updateBattetsInBackend(context, battetsKey, null, true);
      
          // Add the battet to user's collection
          userBattets.push(battetToPurchase);
      
          // Remove the purchased battet from the shop
          const updatedShopBattets = shopBattets.filter((_:any, index:any) => index !== currentBattetIndex);
      
          // Update user's battets in backend
          await updateBattetsInBackend(context, battetsKey, userBattets);
      
          // Update shop battets
          await updateBattetsInBackend(context, shopKey, updatedShopBattets);
      
          // Update user's coins in backend
          await context.redis.set(coinsKey, coins.toString());
      
          // Update currentBattetIndex if necessary
          if (updatedShopBattets.length === 0) {
            setCurrentBattetIndex(0);
          } 
          else if (currentBattetIndex >= updatedShopBattets.length) {
            setCurrentBattetIndex(updatedShopBattets.length - 1);
          }
      
          context.ui.showToast(`Successfully purchased ${battetToPurchase.name} for ${battetToPurchase.price} Bananas`);
          setCurrentView('menu');
      
        } 
        catch (error) {
          console.error("Error purchasing battet:", error);
          context.ui.showToast("An error occurred while purchasing the Battet");
        } 
        finally {
          setIsPurchasing(false);
        }
      };
      const formatTimeRemaining = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        return `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
      };
  
      // If there are no battets left in the shop
      if (shopBattets.length === 0) {
        return (
          <vstack padding="medium" gap="medium">
            <button onPress={() => setCurrentView('menu')}>Back to Menu</button>
            <text weight = "bold" alignment='center'>All battets purchased!</text>
            <text weight = "bold" alignment='center'>
              {timeRemaining > 0
                    ?`Refresh in: ${formatTimeRemaining(timeRemaining)}`
                    : "" }
            </text>
          </vstack>
        );
      }
      return (
        <hstack padding="small" gap="small" width="100%">
          <vstack width="100%" gap="small">
            {currentBattet && selectedImage ? (
              <vstack gap="small">
                <text size="xsmall" alignment = "end">
                  {timeRemaining > 0
                    ?`Refresh in: ${formatTimeRemaining(timeRemaining)}`
                    : "" }
                </text>
                <hstack gap="small" alignment="start">
                <vstack gap = "small">
                </vstack>
                  <image
                    url={selectedImage}
                    imageWidth={150}
                    imageHeight={150}
                  />
                  <vstack gap="small">
                    <text size="small" weight="bold">{currentBattet.name}</text>
                    <text size="xsmall" maxWidth="60%" maxHeight="100%" wrap>{currentBattet.description}</text>
                    <text size="xsmall" weight="bold" maxWidth="60%" maxHeight="100%" wrap>{formatDisplay(currentBattet.passives, " ", true, undefined, false, [['_', ' ']])}</text>
                    <button size="small" maxWidth = "60%" onPress={() => setCurrentView('menu')}>Back to Menu</button>
                  </vstack>
                </hstack>
                <vstack gap="none">
                  <text size="xsmall" weight="bold" wrap>{formatDisplay(currentBattet.stats, "| ", true, ['HP', 'BP', 'ATK', 'DEF', 'LOOKS'], false, [['_', ' ']])}</text>
                  <spacer size="xsmall" />
                  <text size="small" weight="bold" wrap>{formatDisplay(currentBattet.type, ", ")}</text>
                  <spacer size="xsmall" />
                  <text size="xsmall" maxWidth="100%" wrap>{formatDisplay(currentBattet.moves, "\n", true, undefined, true, [['_', ' ']])}</text>
                </vstack>
                <hstack alignment="center middle" width="100%">
                  <hstack gap="small" alignment="top start">
                    <image url="banana.png" imageWidth={20} imageHeight={20} />
                    <text size="small">: {currentBattet.price} / {userData.bananaCount}</text>
                  </hstack>
                </hstack>
                <hstack gap="small">
                  <button size="small" onPress={prevBattet} disabled={isPurchasing}>←</button>
                  <button size="small" onPress={purchaseBattet} appearance="primary" grow disabled={isPurchasing}>
                    Purchase
                  </button>
                  <button size="small" onPress={nextBattet} disabled={isPurchasing}>→</button>
                </hstack>
              </vstack>
            ) : (
              <text>No Battets available</text>
            )}
          </vstack>
        </hstack>
      );
    }

    // Battle render
    if (currentView === 'battle') {
      const { data: battleData, loading, error } = useAsync(async () => {
        const currentUser = await context.reddit.getCurrentUser();
        if (!currentUser) throw new Error('Failed to fetch user data');
        if (!context.postId) {
          throw new Error('Post ID is not available');
        }
        const post = await context.reddit.getPostById(context.postId);
        if (!post) throw new Error('Failed to fetch post data');

        const battleInitiator = await context.redis.get(`battle_initiator_${post.id}`);
        if (!battleInitiator) throw new Error('You did not post this, please start your own game on side menu :)');

        setPostCreator(battleInitiator);

        const user = await context.reddit.getCurrentUser();
        if(!user) throw new Error("User not found");
        const userName = user.username;
        const userKey = `${user.username}_${context.subredditName}_battets`;
        const userBattets = await updateBattetsInBackend(context, userKey, null, true);
        if (!userBattets) throw new Error('No Battets found');
    
        
        const playerBattet = userBattets[0];
        const enemyBattet = createRandomBattet();
    
        return { playerBattet, enemyBattet, userName};
      });

      if (battleData && !battleInitialized) {
        const initialState = Math.random() > 0.5 ? 'playerTurn' : 'enemyTurn';
        setBattleState(initialState);
        setBattleInitialized(true);
        console.log('Battle initialized with state:', initialState);
      }

      const battleInterval = useInterval(() => {
        if (battleState === 'enemyTurn') {
          console.log("Processing enemy turn...");
          handleEnemyTurn();
          setPlayerBattet(playerBattet);
          setEnemyBattet(enemyBattet);
        }

        else if (battleState === "victory"){
          const nextBattet = createRandomBattet
          setPlayerBattet(battleData?.playerBattet);
          setEnemyBattet(nextBattet);
          handleVictory();
          setBattleState(Math.random() > 0.5 ? 'playerTurn' : 'enemyTurn');
        }

        else if (battleState === "defeat"){
          handleDefeat();
          setCurrentView('menu');
        }

        console.log("Current battle state:", battleState);
      }, 2000); 
    
      if (loading) return <text>Loading battle...</text>;
      if (error) return <text>Error: {error.message}</text>;
      if(!battleData) return <text>No battle data available</text>

      if (battleData && !loading && !error) {
        battleInterval.start();
      }

      if (battleData && (!playerBattet || !enemyBattet)) {
        console.log('Setting initial Battet data');
        setPlayerBattet(battleData.playerBattet);
        setEnemyBattet(battleData.enemyBattet);
      }

      const resetBattleStates = () => {
        setPlayerBattet(null);
        setEnemyBattet(null);
        setBattleState('idle');
        setBattleLog([]);
        setBattleInitialized(false);
        setRounds(1);
      };
    
      const handleMoveSelection = (move: BattetMove) => {
        if (battleState !== 'playerTurn' || !playerBattet || !enemyBattet) return;
    
        const { battet, opponent, battleLog: newBattleLog } = moveHandler(
          [playerBattet],
          [enemyBattet],
          playerBattet,
          enemyBattet,
          move,
          context
        );
    
        setPlayerBattet(battet);
        setEnemyBattet(opponent);
        setBattleLog((prevLog) => [...prevLog, ...(newBattleLog ?? [])]);
    
        if (opponent.stats.HP <= 0) {
          setBattleState('victory')
        } 
        else {
          setBattleState('enemyTurn');
        }
      };
    
      const handleEnemyTurn = () => {
        if (!playerBattet || !enemyBattet) return;
    
        const moveNames = Object.keys(enemyBattet.moves);
        const randomMoveName = moveNames[Math.floor(Math.random() * moveNames.length)]
        const { battet, opponent, battleLog: newBattleLog } = moveHandler(
          [enemyBattet],
          [playerBattet],
          enemyBattet,
          playerBattet,
          enemyBattet.moves[randomMoveName],
          context
        );
    
        setPlayerBattet(opponent);
        setEnemyBattet(battet);
        setBattleLog((prevLog) => [...prevLog, ...(newBattleLog ?? [])]);
    
        if (opponent.stats.HP <= 0) {
          setBattleState('defeat');
        } 
        else {
          setBattleState('playerTurn');
        }
      };
      
      const handleVictory = async () => {
        let lvl = false;
        let caught = false;

        context.ui.showToast(`${battleData.playerBattet.name} has won round ${rounds}!`);
        setRounds(prevRounds => prevRounds + 1);
        battleData.playerBattet.xp += 10;
        
        if(battleData.playerBattet.xp >= battleData.playerBattet.xp_to_next_level){
          context.ui.showToast(`${battleData.playerBattet.name} has leveled up to ${(Math.floor(battleData.playerBattet.level + 1))}!`);
          lvl = true;
        }

        if(Math.random() < 0.05){
          context.ui.showToast(`${battleData.enemyBattet.name} has chosen to join you!`);
          caught = true;
          battleData.enemyBattet.stats.HP = battleData.enemyBattet.stats.MAXHP;
          battleData.enemyBattet.stats.BP = battleData.enemyBattet.stats.MAXBP;
          battleData.enemyBattet.statusEffects = []; 
        }
        else {
          context.ui.showToast(`${battleData.enemyBattet.name} will not follow you :(`);
        }

        
        try {
          const currentUser = await context.reddit.getCurrentUser();
          if (!currentUser) throw new Error('Failed to fetch current user');

          const userKey = `${currentUser.username}_${context.subredditName}_battets`;
          const userBattetsJson = await context.redis.get(userKey);
    
          if (userBattetsJson) {
            const userBattets = JSON.parse(userBattetsJson);
            if(lvl){
              levelUp(userBattets[0]);
            }
            battleData.playerBattet.stats.HP = battleData.playerBattet.stats.MAXHP;
            battleData.playerBattet.stats.BP = battleData.playerBattet.stats.MAXBP;
            battleData.playerBattet.stats.ATK = userBattets[0].stats.ATK;
            battleData.playerBattet.stats.DEF = userBattets[0].stats.DEF;
            battleData.playerBattet.stats.LOOKS = userBattets[0].stats.LOOKS;
            battleData.playerBattet.level = userBattets[0].level; 
            battleData.playerBattet.xp_to_next_level = userBattets[0].xp_to_next_level;
            battleData.playerBattet.statusEffects = [];
            userBattets[0] = battleData.playerBattet;

            setBattleLog([]);
            
            if(!battleData.playerBattet){
              console.log(`No player battet found`);
              return;
            }

            if(caught){
              userBattets.push(battleData.enemyBattet);
            }
        
            await context.redis.set(userKey, JSON.stringify(userBattets));
      
            console.log('Updated Battet list saved to Redis');
          } 
          else {
            console.error('No Battets found for the user');
          }
        } 
        catch (error) {
          console.error('Error updating Battet list:', error);
          context.ui.showToast('Failed to update Battet. Please try again later.');
        }
      };
    
      const handleDefeat = async () => {
        context.ui.showToast(`${battleData.playerBattet.name} has lost the battle. Returning to menu.`)
        resetBattleStates();
      
      };

      const MoveButton = ({ moveName, description, onPress, disabled }: {
        [key: string]: any;
        moveName: string;
        description: string;
        onPress: () => void;
        disabled: boolean;
      }) => 
        (
        <vstack 
          gap="none" 
          maxWidth="50%" 
          grow 
          backgroundColor={"secondary-background"}
          padding="small"
          onPress={disabled ? undefined : onPress}
        >
          <text size="small" weight="bold" alignment="center">{moveName.replace('_', ' ')}:</text>
          <text size="xsmall" alignment="center" wrap>{description}</text>
        </vstack>
      );

      console.log("Current battle state:", battleState);
      console.log("Player Battet:", playerBattet);
      console.log("Enemy Battet:", enemyBattet);
      
      return (
        <vstack gap="small" width="100%">
          <hstack gap="medium" alignment="center">
            <vstack alignment="start" width="50%">
              <text size="medium" weight = "bold">{battleData.userName}'s</text>
              <image 
                url={playerBattet?.image[0] ?? 'default_battet_image.png'} 
                imageWidth={150} 
                imageHeight={150}
                resizeMode="cover"
              />
              <text size="medium" weight="bold" wrap>{playerBattet?.name ?? 'Unknown Battet'} Lvl- {playerBattet?.level ?? 1}</text>
              <text size = "small" weight = "bold">HP: {playerBattet?.stats.HP ?? 0}/{playerBattet?.stats.MAXHP ?? 0}</text>
              <text size ="small" weight = "bold">BP: {playerBattet?.stats.BP ?? 0}/{playerBattet?.stats.MAXBP ?? 0}</text>
              <text size = "xsmall" weight = "bold">ATK: {playerBattet?.stats.ATK ?? 0} | DEF: {playerBattet?.stats.DEF ?? 0}</text>
              <text size = "xsmall" weight = "bold">Experience: {playerBattet?.xp ?? 0}/{playerBattet?.xp_to_next_level ?? 100}</text>
            </vstack>
            <vstack alignment="end" width="45%">
              <text size="large" weight = "bold">Wild</text>
              <image 
                url={enemyBattet?.image[0] ?? 'default_battet_image.png'} 
                imageWidth={150} 
                imageHeight={150}
                resizeMode="cover"
              />
              <text size="medium" weight="bold" wrap>{enemyBattet?.name ?? 'Unknown Battet'} Lvl- {enemyBattet?.level ?? 1}</text>
              <text size = "small" weight ="bold">HP: {enemyBattet?.stats.HP ?? 0}/{enemyBattet?.stats.MAXHP ?? 0}</text>
              <text size = "small" weight="bold">BP: {enemyBattet?.stats.BP ?? 0}/{enemyBattet?.stats.MAXBP ?? 0}</text>
              <text size = "xsmall" weight = "bold">ATK: {enemyBattet?.stats.ATK ?? 0} | DEF: {enemyBattet?.stats.DEF ?? 0}</text>
            </vstack>
          </hstack>
          
          <hstack gap="none" alignment="center middle">
            <text size="small" weight="bold">Rounds Survived: {rounds}</text>
            <spacer grow />
            <button 
              onPress={() => {
                resetBattleStates();
                setCurrentView('menu');
              }}
              size="small"
            >
              Return to Menu
            </button>
          </hstack>
          
          <vstack gap="none" maxHeight="80px">
            {battleLog.slice(-5).map((log, index) => (
              <text key={`log-${index}`} size="xsmall" wrap>{log}</text>
            ))}
          </vstack>
          
         <vstack gap="small" width="100%">
          {Object.entries(playerBattet?.moves || {}).sort(([, a], [, b]) => a.Description.localeCompare(b.Description)).reduce((rows, [moveName, move], index) => {
            if (index % 2 === 0) rows.push([]);
            rows[rows.length - 1].push({ moveName, move });
            return rows;
          }, [] as Array<Array<{ moveName: string; move: BattetMove }>>).map((row, rowIndex) => (
        <hstack key={`row-${rowIndex}`} gap="small" width="100%" grow>
          {row.map(({ moveName, move }) => (
            <MoveButton
              key={moveName}
              moveName={moveName}
              description={move.Description}
              onPress={() => handleMoveSelection(move as BattetMove)}
              disabled={battleState !== 'playerTurn'}
              padding="medium"
              grow
          />
        ))}
        {row.length === 1 && (
          <vstack maxWidth="100%" maxHeight="100%" padding="medium" grow />
        )}
      </hstack>
    ))}
      </vstack>
    </vstack>
      );
    }

    if (currentView === 'help') {
      return (
        <vstack padding="medium" gap="medium">
          <text wrap>Welcome to Reddit Battets! Here's how to get started:</text>
          <vstack gap="small">
            <text wrap>• Use the menu to view your Battets</text>
            <text wrap>• Type a Battet's index in the "Party Index" field and check "Apply in Main Party"</text>
            <text wrap>• Hit "Cycle" to set a Battet as your first one to use</text>
            <text wrap>• Currency is tied to Reddit karma</text>
            <text wrap>• You can sell Battets, please ensure when selling a Battet you hit cycle treat cycle like a submit button or claim a weekly Battet from the side menu</text>
            <text wrap>• Use "Battle Wild Battets" button to start battle mode with waves of Battets</text>
            <text wrap>• There's a 5% chance to catch each Battet during battles</text>
          </vstack>
          <button
            grow
            onPress={() => setCurrentView('menu')}
            appearance="secondary"
          >
            Return to menu
          </button>
        </vstack>
        );
      }

    // Fallback render (shouldn't happen)
    return <text>Unknown view</text>;
  },
});

const battetForm: FormFunction = (data: { [key: string]: any }) => {
  const battets = data.battets as UserBattetData[];
  const index = data.index as number;
  const total = data.total as number;
  const currentBattet = battets[index];

  return {
    title: `${index + 1}: ${currentBattet.nick_name ? currentBattet.nick_name : currentBattet.name}`,
    fields: [
      { type: 'number', name: 'party_index', label: 'Party Number', helpText: 'Note: 1st is first in battle, 6th is last. (1-6)', min: 1, max: 6, step: 1, defaultValue: index + 1 },
      { type: 'boolean', name: 'set_main', label: 'Set in Main Party' },
      { type: 'string', name: 'nick_name', label: 'Nickname', defaultValue: currentBattet.nick_name ? currentBattet.nick_name : currentBattet.name },
      { type: 'boolean', name: 'submit_nickname', label: 'Save Nickname', helpText: 'Hit cycle after checking to submit.' },
      { type: 'paragraph', name: 'description', label: 'Description', disabled: true, defaultValue: currentBattet.description },
      { type: 'boolean', name: 'breed', label: 'Can Breed', disabled: true, defaultValue: currentBattet.breed },
      { type: 'number', name: 'level', label: 'Level', disabled: true, defaultValue: currentBattet.level },
      { type: 'number', name: 'xp', label: 'XP', disabled: true, defaultValue: currentBattet.xp },
      { type: 'number', name: 'xp_to_next_level', label: 'XP to Next Level', disabled: true, defaultValue: currentBattet.xp_to_next_level },
      { type: 'paragraph', name: 'passives', label: 'Passive', disabled: true, defaultValue: formatDisplay(currentBattet.passives, " ", true, undefined, false, [['_', ' ']]) },
      { type: 'string', name: 'type', label: 'Type', disabled: true, defaultValue: formatDisplay(currentBattet.type, ', ') },
      { type: 'paragraph', name: 'stats', label: 'Stats', disabled: true, defaultValue: formatDisplay(currentBattet.stats, " | ", true, ['HP', 'BP', 'ATK', 'DEF', 'SPEED', 'LOOKS'], false, [['_', ' ']]) },
      { type: 'paragraph', name: 'selected_moves', label: 'Selected Moves', defaultValue: formatDisplay(currentBattet.selectedMoves, "\n\n", true, undefined, true, [['_', ' ']]) },
      { type: 'boolean', name: 'sell', label: 'Sell Battet to the unknown', helpText: 'Will sell Battet for a random amount of Bananas could be high or low.' },
      { type: 'string', name: '_index', label: 'Battet #', disabled: true, defaultValue: String(index) },
      { type: 'string', name: '_total', label: 'Total Battets', disabled: true, defaultValue: String(total) },
      { type: 'string', name: '_battets', label: 'Battets', disabled: true, defaultValue: JSON.stringify(battets) },
      { type: 'boolean', name: 'previous', label: 'Previous'},
    ],
    acceptLabel: 'Cycle',
    cancelLabel: 'Exit',
  };
};

const battetFormHandler = Devvit.createForm(
  battetForm,
  async (event: FormOnSubmitEvent<any>, context) => {
    console.log('Form submission event:', event);
    let currentIndex = parseInt(event.values._index as string, 10);
    let total = parseInt(event.values._total as string, 10);
    let battets = JSON.parse(event.values._battets as string) as UserBattetData[];
    let nextIndex: number | undefined;
    let updateBackend = false;

    // Check if the form was submitted (Cycle button clicked)
    if (Object.keys(event.values).length > 0) {
      if (event.values.submit_nickname) {
        battets[currentIndex].nick_name = event.values.nick_name;
        updateBackend = true;
      }

      if (event.values.set_main) {
        const newPartyIndex = parseInt(event.values.party_index, 10) - 1; // Convert to 0-based index
        if (newPartyIndex >= 0 && newPartyIndex <= 5) { // 0-5 for 1-6 party positions
          const currentBattet = battets[currentIndex];
          const targetBattet = battets.find(b => b.partyIndex === newPartyIndex);
      
          // Swap the partyIndex values
          if (targetBattet) {
            targetBattet.partyIndex = currentBattet.partyIndex;
          }
          currentBattet.partyIndex = newPartyIndex;
      
          // Rearrange the battets array
          battets = battets.sort((a, b) => {
            if (a.partyIndex === undefined && b.partyIndex === undefined) return 0;
            if (a.partyIndex === undefined) return 1;
            if (b.partyIndex === undefined) return -1;
            return a.partyIndex - b.partyIndex;
          });
      
          // Update the currentIndex to reflect the new position
          currentIndex = battets.findIndex(b => b === currentBattet);
      
          updateBackend = true;
          context.ui.showToast("Main party successfully updated.");
        } else {
          context.ui.showToast('Invalid party index. Must be between 1 and 6.');
        }
      }

      if (updateBackend) {
        const user = await context.reddit.getCurrentUser();
        if (user) {
          const battetsKey = `${user.username}_${context.subredditName}_battets`;
          await updateBattetsInBackend(context, battetsKey, battets);
        } else {
          context.ui.showToast('Failed to update: User not found');
        }
      }

      if (event.values.previous) {
        nextIndex = (currentIndex - 1 + total) % total;
      } else {
        nextIndex = (currentIndex + 1) % total;
      }

      if (event.values.sell) {
        const user = await context.reddit.getCurrentUser();
        if (user) {
          const battetsKey = `${user.username}_${context.subredditName}_battets`;
          const coinsKey = `${user.username}_${context.subredditName}_coins`;

          // Calculate random sale price between 25 and 150 bananas
          const salePrice = Math.floor(Math.random() * (150 - 25 + 1)) + 25;

          // Remove the Battet from the array
          const soldBattet = battets.splice(currentIndex, 1)[0];

          // Update user's coins using getOrInitializeUserCoins
          let currentCoins = await getOrInitializeUserCoins(context, user);
          currentCoins += salePrice;
          await context.redis.set(coinsKey, currentCoins.toString());

          // Update battets in Redis
          await context.redis.set(battetsKey, JSON.stringify(battets));

          context.ui.showToast(`Sold ${soldBattet.name} for ${salePrice} bananas!`);

          updateBackend = true;

          // Adjust total and currentIndex
          total -= 1;
          if (currentIndex >= total) {
            currentIndex = total - 1;
          }
        } else {
          context.ui.showToast('Failed to sell Battet: User not found');
        }
      }
      
      if (nextIndex !== undefined) {
        displayBattetsForm(context, battets, nextIndex);
      }
    } 
    
    else {
      context.ui.showToast('Exiting Battet viewer');
      return;
    }
  }
);

function displayBattetsForm(context: any, battets: UserBattetData[], currentIndex: number = 0) {
  context.ui.showForm(battetFormHandler, {
    battets,
    index: currentIndex,
    total: battets.length,
  });
}

Devvit.addMenuItem({
  label: 'Battets',
  location: 'subreddit',
  onPress: async (event, context) => {
    try {
      const user = await context.reddit.getCurrentUser();
      if (!user) {
        context.ui.showToast('Failed to fetch user data');
        return;
      }

      const userKey = `${user.username}_${context.subredditName}_battets`;
      const userBattets = await updateBattetsInBackend(context, userKey, null, true);

      if (userBattets.length === 0) {
        context.ui.showToast('You don\'t have any battets yet!');
        return;
      }

      displayBattetsForm(context, userBattets);
    } 
    catch (error) {
      console.error('Error in Battets menu item:', error);
      context.ui.showToast('An error occurred while fetching your Battets');
    }
  },
});

Devvit.addMenuItem({
  label: 'Clear Battet Data',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (event, context) => {
    try {
      const user = await context.reddit.getCurrentUser();
      if (!user) {
        context.ui.showToast('Failed to fetch user data');
        return;
      }

      const userKey = `${user.username}_${context.subredditName}_battets`;
      
      // Clear the user's Battet data
      await context.redis.del(userKey);

      context.ui.showToast('Battet data cleared successfully');
    } catch (error) {
      console.error('Error clearing Battet data:', error);
      context.ui.showToast('An error occurred while clearing Battet data');
    }
  },
});

// Menu item for clearing the weekly Battet data
Devvit.addMenuItem({
  label: 'Clear Weekly Battet Data',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (event, context) => {
    try {
      // Clear the weekly Battet data
      await context.redis.del('weeklyBattet');
      await context.redis.del('weeklyBattetClaims');
      await context.redis.del('nextWeeklyBattetReset');

      context.ui.showToast('Weekly Battet data cleared successfully');
    } catch (error) {
      console.error('Error clearing weekly Battet data:', error);
      context.ui.showToast('An error occurred while clearing weekly Battet data');
    }
  },
});

// Menu item for claiming the weekly Battet
Devvit.addMenuItem({
  label: 'Claim Weekly Battet',
  location: 'subreddit',
  onPress: async (event, context) => {
    const user = await context.reddit.getCurrentUser();
    if (!user) {
      context.ui.showToast('Failed to fetch user data');
      return;
    }

    const nextResetTimestampStr = await context.redis.get('nextWeeklyBattetReset');
    const now = new Date().getTime();

    // Check if it's time for a new weekly Battet
    if (!nextResetTimestampStr || isNaN(parseInt(nextResetTimestampStr)) || now >= parseInt(nextResetTimestampStr)) {
      // Reset the weekly Battet and claims
      const newWeeklyBattet = createRandomBattet();
      await context.redis.set('weeklyBattet', JSON.stringify(newWeeklyBattet));
      await context.redis.del('weeklyBattetClaims');

      // Set the next reset time (7 days from now)
      const nextReset = now + 7 * 24 * 60 * 60 * 1000;
      await context.redis.set('nextWeeklyBattetReset', nextReset.toString());
    }

    // Check if the user has already claimed this week's Battet
    const claimsJson = await context.redis.get('weeklyBattetClaims');
    const claims = claimsJson ? JSON.parse(claimsJson) : [];
    if (claims.includes(user.username)) {
      const nextResetTimestamp = await context.redis.get('nextWeeklyBattetReset');
      if (nextResetTimestamp) {
        const timeUntilReset = parseInt(nextResetTimestamp) - now;
        
        const days = Math.floor(timeUntilReset / (24 * 60 * 60 * 1000));
        const hours = Math.floor((timeUntilReset % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const minutes = Math.floor((timeUntilReset % (60 * 60 * 1000)) / (60 * 1000));

        context.ui.showToast(`You have already claimed this week's Battet. Next reset in ${days}d ${hours}h ${minutes}m`);
      } else {
        context.ui.showToast('You have already claimed this week\'s Battet');
      }
      return;
    }

    // Get the weekly Battet
    const weeklyBattetJson = await context.redis.get('weeklyBattet');
    if (!weeklyBattetJson) {
      context.ui.showToast('Failed to fetch weekly Battet');
      return;
    }

    const weeklyBattet = JSON.parse(weeklyBattetJson) as UserBattetData;

    // Add the Battet to the user's collection
    const userKey = `${user.username}_${context.subredditName}_battets`;
    const userBattets = await updateBattetsInBackend(context, userKey, null, true);
    userBattets.push(weeklyBattet);
    await updateBattetsInBackend(context, userKey, userBattets);

    // Mark the user as having claimed this week's Battet
    claims.push(user.username);
    await context.redis.set('weeklyBattetClaims', JSON.stringify(claims));

    context.ui.showToast(`You have claimed ${weeklyBattet.name}!`);
  },
});

Devvit.addMenuItem({
  label: 'Post Game Menu',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (event, context: Context) => {
    try {
      const currentUser = await context.reddit.getCurrentUser();
      const currentSubreddit = await context.reddit.getCurrentSubreddit();
      
      if (!currentUser || !currentSubreddit) {
        context.ui.showToast('Failed to get user or subreddit information');
        return;
      }

      const post = await context.reddit.submitPost({
        title: `Battet Game Menu`,
        subredditName: currentSubreddit.name,
        preview: (
          <vstack>
            <text>initializing Battet Game Menu...</text>
          </vstack>
        )
      });

      // Store the initiating user's information
      if (post) {
        await context.redis.set(`battle_initiator_${post.id}`, currentUser.username);
      }

      context.ui.showToast('Game Menu Posted!');
    } catch (error) {
      console.error('Error initiating battle:', error);
      context.ui.showToast(`Error initiating battle: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

export default Devvit;
