/**
 * seed.js — Populate the Item master catalog for search to work
 *
 * Run once:  node seed.js
 *
 * Creates catalog items with name, aliases, category, price, substitutes.
 * Idempotent: uses upsert so re-running is safe.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Item     = require('./models/Item');

const CATALOG = [
  // ── Dairy ──────────────────────────────────────────────────────
  { name: 'milk', aliases: ['doodh', 'dudh', 'whole milk', 'full cream milk'], category: 'dairy', price: 60,  substitutes: ['almond milk', 'soy milk', 'oat milk'] },
  { name: 'almond milk',  aliases: ['badam doodh'],           category: 'dairy',    price: 180, substitutes: ['milk', 'oat milk'] },
  { name: 'soy milk',     aliases: ['soya milk'],             category: 'dairy',    price: 120, substitutes: ['milk', 'almond milk'] },
  { name: 'oat milk',     aliases: ['oats milk'],             category: 'dairy',    price: 150, substitutes: ['milk', 'almond milk'] },
  { name: 'curd',         aliases: ['dahi', 'yogurt'],        category: 'dairy',    price: 40,  substitutes: ['greek yogurt'] },
  { name: 'greek yogurt', aliases: ['thick curd'],            category: 'dairy',    price: 90,  substitutes: ['curd'] },
  { name: 'paneer',       aliases: ['cottage cheese'],        category: 'dairy',    price: 100, substitutes: ['tofu'] },
  { name: 'tofu',         aliases: ['bean curd', 'soya paneer'], category: 'dairy', price: 80,  substitutes: ['paneer'] },
  { name: 'butter',       aliases: ['makhan'],                category: 'dairy',    price: 55,  substitutes: ['ghee', 'margarine'] },
  { name: 'ghee',         aliases: ['clarified butter', 'desi ghee'], category: 'dairy', price: 500, substitutes: ['butter', 'coconut oil'] },
  { name: 'cheese',       aliases: ['cheddar', 'mozzarella'], category: 'dairy',    price: 200, substitutes: ['paneer'] },
  { name: 'cream',        aliases: ['fresh cream', 'malai'],  category: 'dairy',    price: 80,  substitutes: [] },
  { name: 'lassi',        aliases: ['sweet lassi', 'salted lassi'], category: 'dairy', price: 30, substitutes: ['buttermilk', 'curd'] },
  { name: 'buttermilk',   aliases: ['chaas', 'chach'],        category: 'dairy',    price: 20,  substitutes: ['lassi'] },

  // ── Produce ────────────────────────────────────────────────────
  { name: 'apple',      aliases: ['seb', 'red apple', 'green apple'],  category: 'produce', price: 120, substitutes: ['pear', 'guava'] },
  { name: 'banana',     aliases: ['kela', 'plantain'],                 category: 'produce', price: 40,  substitutes: ['mango'] },
  { name: 'tomato',     aliases: ['tamatar'],                          category: 'produce', price: 30,  substitutes: ['canned tomato'] },
  { name: 'potato',     aliases: ['aloo', 'batata'],                   category: 'produce', price: 25,  substitutes: ['sweet potato'] },
  { name: 'sweet potato', aliases: ['shakarkandi', 'yam'],             category: 'produce', price: 35,  substitutes: ['potato'] },
  { name: 'onion',      aliases: ['pyaz', 'pyaaz'],                    category: 'produce', price: 35,  substitutes: ['shallot', 'spring onion'] },
  { name: 'garlic',     aliases: ['lahsun', 'lasan'],                  category: 'produce', price: 50,  substitutes: ['garlic powder'] },
  { name: 'ginger',     aliases: ['adrak', 'adu'],                     category: 'produce', price: 60,  substitutes: ['ginger powder'] },
  { name: 'spinach',    aliases: ['palak'],                            category: 'produce', price: 20,  substitutes: ['fenugreek', 'kale'] },
  { name: 'carrot',     aliases: ['gajar'],                            category: 'produce', price: 30,  substitutes: ['beetroot'] },
  { name: 'cucumber',   aliases: ['kheera', 'kakdi'],                  category: 'produce', price: 20,  substitutes: ['zucchini'] },
  { name: 'capsicum',   aliases: ['shimla mirchi', 'bell pepper'],     category: 'produce', price: 40,  substitutes: ['chilli'] },
  { name: 'cauliflower', aliases: ['gobi', 'phool gobi'],              category: 'produce', price: 25,  substitutes: ['broccoli'] },
  { name: 'broccoli',   aliases: ['hari gobi'],                        category: 'produce', price: 60,  substitutes: ['cauliflower'] },
  { name: 'peas',       aliases: ['matar', 'green peas'],              category: 'produce', price: 50,  substitutes: ['edamame'] },
  { name: 'mango',      aliases: ['aam', 'alphonso', 'langra'],        category: 'produce', price: 100, substitutes: ['peach', 'nectarine'] },
  { name: 'orange',     aliases: ['narangi', 'santra'],                category: 'produce', price: 80,  substitutes: ['lemon', 'grapefruit'] },
  { name: 'lemon',      aliases: ['nimbu', 'lime'],                    category: 'produce', price: 30,  substitutes: ['orange', 'vinegar'] },
  { name: 'papaya',     aliases: ['papita'],                           category: 'produce', price: 50,  substitutes: ['mango'] },
  { name: 'watermelon', aliases: ['tarbuz'],                           category: 'produce', price: 30,  substitutes: ['muskmelon'] },
  { name: 'grapes',     aliases: ['angur', 'angoor'],                  category: 'produce', price: 80,  substitutes: ['raisins'] },
  { name: 'guava',      aliases: ['amrood', 'peru'],                   category: 'produce', price: 50,  substitutes: ['apple'] },

  // ── Snacks ─────────────────────────────────────────────────────
  { name: 'chips',       aliases: ['potato chips', 'crisps', 'wafers'], category: 'snacks', price: 20,  substitutes: ['popcorn', 'namkeen'] },
  { name: 'popcorn',     aliases: ['corn pops'],                       category: 'snacks',  price: 30,  substitutes: ['chips'] },
  { name: 'biscuit',     aliases: ['cookie', 'cracker', 'parle-g'],    category: 'snacks',  price: 10,  substitutes: ['rusk', 'toast'] },
  { name: 'namkeen',     aliases: ['mixture', 'chakli', 'farsan'],     category: 'snacks',  price: 40,  substitutes: ['chips'] },
  { name: 'chocolate',   aliases: ['choco', 'dairy milk'],             category: 'snacks',  price: 40,  substitutes: ['candy'] },
  { name: 'peanuts',     aliases: ['moongfali', 'groundnuts'],         category: 'snacks',  price: 30,  substitutes: ['cashews', 'almonds'] },
  { name: 'cashews',     aliases: ['kaju'],                            category: 'snacks',  price: 200, substitutes: ['almonds', 'peanuts'] },
  { name: 'almonds',     aliases: ['badam'],                           category: 'snacks',  price: 250, substitutes: ['cashews', 'walnuts'] },
  { name: 'walnuts',     aliases: ['akhrot'],                          category: 'snacks',  price: 300, substitutes: ['almonds'] },
  { name: 'dates',       aliases: ['khajoor', 'khajur'],               category: 'snacks',  price: 180, substitutes: ['raisins', 'figs'] },
  { name: 'makhana',     aliases: ['fox nuts', 'lotus seeds'],         category: 'snacks',  price: 120, substitutes: ['popcorn'] },

  // ── Beverages ──────────────────────────────────────────────────
  { name: 'tea',         aliases: ['chai', 'black tea', 'masala chai'], category: 'beverages', price: 80,  substitutes: ['coffee', 'green tea'] },
  { name: 'coffee',      aliases: ['kaapi', 'filter coffee'],           category: 'beverages', price: 200, substitutes: ['tea'] },
  { name: 'green tea',   aliases: ['tulsi tea', 'herbal tea'],          category: 'beverages', price: 120, substitutes: ['tea'] },
  { name: 'juice',       aliases: ['fruit juice', 'orange juice'],      category: 'beverages', price: 100, substitutes: ['coconut water'] },
  { name: 'coconut water', aliases: ['nariyal pani', 'tender coconut'], category: 'beverages', price: 50,  substitutes: ['juice'] },
  { name: 'soda',        aliases: ['club soda', 'sparkling water'],     category: 'beverages', price: 30,  substitutes: ['water'] },
  { name: 'water',       aliases: ['mineral water', 'packaged water'],  category: 'beverages', price: 20,  substitutes: [] },
  { name: 'energy drink', aliases: ['red bull', 'monster'],             category: 'beverages', price: 120, substitutes: ['coffee'] },

  // ── Grains & Staples ────────────────────────────────────────────
  { name: 'rice',        aliases: ['chawal', 'basmati', 'white rice'],  category: 'grains', price: 80,  substitutes: ['quinoa', 'millets'] },
  { name: 'basmati rice', aliases: ['long grain rice'],                 category: 'grains', price: 120, substitutes: ['rice', 'quinoa'] },
  { name: 'atta',        aliases: ['wheat flour', 'gehu atta', 'chapati flour'], category: 'grains', price: 55, substitutes: ['maida', 'multigrain atta'] },
  { name: 'maida',       aliases: ['all purpose flour', 'refined flour'], category: 'grains', price: 40, substitutes: ['atta'] },
  { name: 'bread',       aliases: ['white bread', 'brown bread', 'pav'], category: 'grains', price: 40,  substitutes: ['roti', 'paratha'] },
  { name: 'pasta',       aliases: ['macaroni', 'spaghetti', 'penne'],   category: 'grains', price: 60,  substitutes: ['noodles', 'rice'] },
  { name: 'noodles',     aliases: ['maggi', 'instant noodles', 'ramen'], category: 'grains', price: 14,  substitutes: ['pasta'] },
  { name: 'oats',        aliases: ['rolled oats', 'quaker oats'],       category: 'grains', price: 120, substitutes: ['muesli', 'cornflakes'] },
  { name: 'cornflakes',  aliases: ['corn flakes', 'breakfast cereal'],  category: 'grains', price: 100, substitutes: ['oats', 'muesli'] },
  { name: 'quinoa',      aliases: [],                                    category: 'grains', price: 250, substitutes: ['rice', 'millets'] },
  { name: 'millets',     aliases: ['bajra', 'jowar', 'ragi'],           category: 'grains', price: 70,  substitutes: ['rice'] },

  // ── Pulses & Legumes ────────────────────────────────────────────
  { name: 'toor dal',    aliases: ['arhar dal', 'pigeon pea'],          category: 'pulses', price: 120, substitutes: ['moong dal', 'masoor dal'] },
  { name: 'moong dal',   aliases: ['green gram', 'mung dal'],           category: 'pulses', price: 100, substitutes: ['toor dal', 'masoor dal'] },
  { name: 'masoor dal',  aliases: ['red lentil', 'pink lentil'],        category: 'pulses', price: 90,  substitutes: ['moong dal'] },
  { name: 'chana dal',   aliases: ['split chickpea', 'bengal gram'],    category: 'pulses', price: 100, substitutes: ['toor dal'] },
  { name: 'rajma',       aliases: ['kidney beans', 'red beans'],        category: 'pulses', price: 110, substitutes: ['chana', 'black beans'] },
  { name: 'chana',       aliases: ['chickpeas', 'kabuli chana', 'chole'], category: 'pulses', price: 100, substitutes: ['rajma'] },
  { name: 'black-eyed peas', aliases: ['lobia', 'chawli'],              category: 'pulses', price: 90,  substitutes: ['chana'] },

  // ── Spices & Condiments ─────────────────────────────────────────
  { name: 'salt',        aliases: ['namak', 'iodised salt', 'rock salt'], category: 'spices', price: 20,  substitutes: [] },
  { name: 'sugar',       aliases: ['cheeni', 'shakkar', 'white sugar'],  category: 'spices', price: 45,  substitutes: ['jaggery', 'honey', 'stevia'] },
  { name: 'jaggery',     aliases: ['gur', 'palm sugar'],                 category: 'spices', price: 60,  substitutes: ['sugar', 'honey'] },
  { name: 'honey',       aliases: ['shahad', 'natural honey'],           category: 'spices', price: 180, substitutes: ['sugar', 'jaggery'] },
  { name: 'turmeric',    aliases: ['haldi', 'haldee'],                   category: 'spices', price: 60,  substitutes: [] },
  { name: 'cumin',       aliases: ['jeera', 'zeera'],                    category: 'spices', price: 80,  substitutes: [] },
  { name: 'coriander powder', aliases: ['dhania powder'],                category: 'spices', price: 50,  substitutes: [] },
  { name: 'red chilli',  aliases: ['lal mirchi', 'chilli powder', 'mirchi'], category: 'spices', price: 60, substitutes: ['paprika'] },
  { name: 'black pepper', aliases: ['kali mirchi', 'pepper'],            category: 'spices', price: 100, substitutes: ['white pepper'] },
  { name: 'garam masala', aliases: ['mixed spices', 'biryani masala'],   category: 'spices', price: 80,  substitutes: [] },
  { name: 'mustard seeds', aliases: ['rai', 'sarson'],                   category: 'spices', price: 40,  substitutes: [] },
  { name: 'cooking oil', aliases: ['sunflower oil', 'vegetable oil', 'tel'], category: 'condiments', price: 140, substitutes: ['olive oil', 'coconut oil'] },
  { name: 'olive oil',   aliases: ['extra virgin olive oil'],             category: 'condiments', price: 400, substitutes: ['cooking oil'] },
  { name: 'coconut oil', aliases: ['nariyal tel', 'copra oil'],           category: 'condiments', price: 200, substitutes: ['cooking oil', 'ghee'] },
  { name: 'ketchup',     aliases: ['tomato sauce', 'tomato ketchup'],     category: 'condiments', price: 80,  substitutes: ['tomato puree'] },
  { name: 'soy sauce',   aliases: ['shoyu', 'dark soy sauce'],            category: 'condiments', price: 90,  substitutes: ['fish sauce'] },
  { name: 'vinegar',     aliases: ['white vinegar', 'apple cider vinegar'], category: 'condiments', price: 60, substitutes: ['lemon juice'] },

  // ── Meat & Eggs ─────────────────────────────────────────────────
  { name: 'eggs',        aliases: ['anda', 'hen eggs', 'free range eggs'], category: 'meat', price: 80,  substitutes: ['tofu'] },
  { name: 'chicken',     aliases: ['murga', 'broiler chicken'],            category: 'meat', price: 180, substitutes: ['tofu', 'paneer'] },
  { name: 'mutton',      aliases: ['lamb', 'goat meat', 'gosht'],          category: 'meat', price: 600, substitutes: ['chicken'] },

  // ── Household ────────────────────────────────────────────────────
  { name: 'soap',        aliases: ['sabun', 'bathing soap', 'hand wash'],  category: 'household', price: 30,  substitutes: [] },
  { name: 'shampoo',     aliases: ['hair wash', 'head and shoulders'],     category: 'household', price: 100, substitutes: [] },
  { name: 'toothpaste',  aliases: ['dant manjan', 'colgate', 'pepsodent'], category: 'household', price: 60,  substitutes: [] },
  { name: 'detergent',   aliases: ['washing powder', 'surf excel', 'ariel'], category: 'household', price: 120, substitutes: [] },
  { name: 'dish wash',   aliases: ['dishwashing liquid', 'vim', 'pril'],   category: 'household', price: 70,  substitutes: [] },
  { name: 'toilet paper', aliases: ['tissue paper', 'bathroom tissue'],    category: 'household', price: 150, substitutes: [] },
];

async function seed() {
  if (!process.env.MONGO_URI) {
    console.error('❌  MONGO_URI not set. Add it to Backend/.env first.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅  Connected to MongoDB');

  let created = 0;
  let updated = 0;

  for (const item of CATALOG) {
    const result = await Item.findOneAndUpdate(
      { name: item.name },
      { $set: item },
      { upsert: true, new: true }
    );
    if (result) {
      // We can't easily tell create vs update without more code — just count total
      created++;
    }
  }

  console.log(`✅  Seeded ${created} catalog items`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌  Seed failed:', err.message);
  process.exit(1);
});
