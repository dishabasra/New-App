// Every place in the city is a scene: a short branching conversation.
//
// Node fields:
//   npc      what the character says (spoken aloud)
//   tip      optional coaching note shown under the line
//   replies  things the learner can say. `say` is the suggested phrase,
//            `match` is a list of keyword groups: the reply matches when
//            every group has at least one of its words in what was said.
//   any      node to go to when the learner says anything else (open questions)
//   end      true when the conversation is complete
//
// Scene `objectives` form the mission checklist: each is ticked once the
// conversation reaches any node listed in `reach`.
//
// `{name}` in an npc line is replaced with the learner's name.

export const SCENES = [
  {
    id: "cafe",
    objectives: [{"label": "Order a drink", "reach": ["size"]}, {"label": "Choose your size", "reach": ["snack"]}, {"label": "Add a snack (or not)", "reach": ["here"]}, {"label": "Pay for your order", "reach": ["bye"]}],
    name: "Bean There Café",
    emoji: "☕",
    color: "#f59e0b",
    pos: { x: 17, y: 22 },
    unlock: 0,
    level: "Beginner",
    goal: "Order a drink and a snack, then pay.",
    npc: { name: "Maya", avatar: "👩🏽‍🍳", role: "Barista", pitch: 1.15, rate: 0.95 },
    vocab: ["I'd like…", "to go / for here", "How much is it?", "large / medium / small"],
    start: "hello",
    nodes: {
      hello: {
        npc: "Hi there! Welcome to Bean There. What can I get for you today?",
        tip: "\"I'd like…\" is a polite way to order.",
        replies: [
          { say: "Hi! I'd like a latte, please.", match: [["latte"]], next: "size", xp: 10 },
          { say: "Can I have a hot chocolate?", match: [["chocolate", "cocoa"]], next: "size", xp: 10 },
          { say: "What do you recommend?", match: [["recommend", "suggest", "good", "best", "popular"]], next: "recommend", xp: 15 },
        ],
      },
      recommend: {
        npc: "Our caramel cold brew is really popular. It's sweet and smooth. Want to try it?",
        replies: [
          { say: "Sure, I'll try the cold brew.", match: [["sure", "yes", "yeah", "okay", "ok", "try", "sounds"]], next: "size", xp: 10 },
          { say: "No thanks, just a latte please.", match: [["no", "latte", "instead"]], next: "size", xp: 10 },
        ],
      },
      size: {
        npc: "Great choice. What size would you like: small, medium, or large?",
        replies: [
          { say: "Medium, please.", match: [["medium", "regular"]], next: "snack", xp: 10 },
          { say: "A large one, please.", match: [["large", "big"]], next: "snack", xp: 10 },
          { say: "Small is fine.", match: [["small", "little"]], next: "snack", xp: 10 },
        ],
      },
      snack: {
        npc: "Got it. Would you like anything to eat? We have fresh croissants and blueberry muffins.",
        replies: [
          { say: "Yes, a croissant please.", match: [["croissant"]], next: "here", xp: 10 },
          { say: "I'll take a blueberry muffin.", match: [["muffin", "blueberry"]], next: "here", xp: 10 },
          { say: "No thanks, just the drink.", match: [["no", "nothing", "just"]], next: "here", xp: 10 },
        ],
      },
      here: {
        npc: "Is that for here or to go?",
        tip: "\"To go\" means you take it with you.",
        replies: [
          { say: "For here, please.", match: [["here", "stay", "sit"]], next: "pay", xp: 10 },
          { say: "To go, please.", match: [["go", "takeaway", "take away"]], next: "pay", xp: 10 },
        ],
      },
      pay: {
        npc: "Perfect. That comes to six fifty. How would you like to pay?",
        replies: [
          { say: "Can I pay by card?", match: [["card", "credit", "debit", "tap", "phone", "apple"]], next: "bye", xp: 10 },
          { say: "I'll pay in cash.", match: [["cash", "money", "coins"]], next: "bye", xp: 10 },
          { say: "Sorry, how much was it?", match: [["how much", "sorry", "again", "repeat"]], next: "repeat", xp: 15 },
        ],
      },
      repeat: {
        npc: "No problem! It's six dollars and fifty cents.",
        replies: [
          { say: "Thanks. Here's my card.", match: [["card"]], next: "bye", xp: 10 },
          { say: "Okay, here's the cash.", match: [["cash", "money", "here"]], next: "bye", xp: 10 },
        ],
      },
      bye: {
        npc: "All done! Your order will be ready in a minute. Have a lovely day, {name}!",
        end: true,
      },
    },
  },
  {
    id: "market",
    objectives: [{"label": "Ask about the fruit", "reach": ["apples", "berries"]}, {"label": "Say how much you want", "reach": ["deal"]}, {"label": "Haggle or pay", "reach": ["pay"]}],
    name: "Sunday Market",
    emoji: "🍎",
    color: "#22c55e",
    pos: { x: 50, y: 22 },
    unlock: 40,
    level: "Beginner",
    goal: "Buy fruit, ask about prices and get a deal.",
    npc: { name: "Tony", avatar: "👨🏻‍🌾", role: "Fruit seller", pitch: 0.9, rate: 1 },
    vocab: ["How much are…?", "a kilo of…", "Can you do a better price?", "That's all, thanks."],
    start: "hello",
    nodes: {
      hello: {
        npc: "Morning! Fresh fruit, best in town. What are you looking for?",
        replies: [
          { say: "How much are the apples?", match: [["apple"]], next: "apples", xp: 10 },
          { say: "Do you have any strawberries?", match: [["strawberr", "berries"]], next: "berries", xp: 10 },
          { say: "I'm just looking, thanks.", match: [["looking", "browsing"]], next: "looking", xp: 10 },
        ],
      },
      looking: {
        npc: "Take your time! Today the strawberries are on special, and the apples just came in.",
        replies: [
          { say: "Oh, how much are the apples?", match: [["apple"]], next: "apples", xp: 10 },
          { say: "Tell me about the strawberries.", match: [["strawberr", "special", "berries"]], next: "berries", xp: 10 },
        ],
      },
      apples: {
        npc: "Apples are three dollars a kilo. How many do you want?",
        tip: "Use \"a kilo of\" or a number: \"two kilos\", \"six apples\".",
        replies: [
          { say: "I'll take one kilo, please.", match: [["one", "a kilo", "1"]], next: "deal", xp: 10 },
          { say: "Two kilos, please.", match: [["two", "2"]], next: "deal", xp: 10 },
        ],
      },
      berries: {
        npc: "Strawberries are five dollars a box today. Super sweet. How many boxes?",
        replies: [
          { say: "Just one box, please.", match: [["one", "1", "a box"]], next: "deal", xp: 10 },
          { say: "Can I get two boxes?", match: [["two", "2"]], next: "deal", xp: 10 },
        ],
      },
      deal: {
        npc: "Here you go. Anything else for you?",
        replies: [
          { say: "Can you do a better price?", match: [["price", "discount", "cheaper", "deal", "better"]], next: "discount", xp: 20 },
          { say: "That's all, thanks. How much is it?", match: [["all", "that's it", "how much", "total"]], next: "pay", xp: 10 },
        ],
      },
      discount: {
        npc: "Ha! You drive a hard bargain. Okay, one dollar off for you, friend.",
        tip: "Haggling is common at markets. You just earned bonus XP!",
        replies: [
          { say: "Thank you so much!", match: [["thank", "great", "awesome", "perfect"]], next: "pay", xp: 10 },
        ],
      },
      pay: {
        npc: "My pleasure. Enjoy the fruit, {name}! See you next Sunday.",
        end: true,
      },
    },
  },
  {
    id: "taxi",
    objectives: [{"label": "Say where you're going", "reach": ["time"]}, {"label": "Chat with the driver", "reach": ["tip"]}, {"label": "Pay the fare", "reach": ["bye"]}],
    name: "Yellow Cab",
    emoji: "🚕",
    color: "#eab308",
    pos: { x: 83, y: 22 },
    unlock: 90,
    level: "Beginner",
    goal: "Tell the driver where to go and chat on the way.",
    npc: { name: "Linda", avatar: "👩🏼‍🦳", role: "Taxi driver", pitch: 1.05, rate: 1.05 },
    vocab: ["Could you take me to…?", "How long will it take?", "You can drop me here.", "Keep the change."],
    start: "hello",
    nodes: {
      hello: {
        npc: "Hello! Where are you heading today?",
        replies: [
          { say: "Could you take me to the airport?", match: [["airport"]], next: "time", xp: 10 },
          { say: "To the city museum, please.", match: [["museum"]], next: "time", xp: 10 },
          { say: "The Grand Hotel, please.", match: [["hotel"]], next: "time", xp: 10 },
        ],
      },
      time: {
        npc: "No problem. Traffic is a little busy right now.",
        replies: [
          { say: "How long will it take?", match: [["how long", "minutes", "time", "far"]], next: "long", xp: 15 },
          { say: "Okay, no rush.", match: [["okay", "ok", "rush", "fine", "no problem"]], next: "chat", xp: 10 },
        ],
      },
      long: {
        npc: "About twenty minutes. So, are you visiting, or do you live here?",
        replies: [
          { say: "I'm just visiting for a week.", match: [["visit", "trip", "holiday", "vacation", "tourist"]], next: "tip", xp: 10 },
          { say: "I live here. I just moved.", match: [["live", "moved", "local", "work"]], next: "tip", xp: 10 },
        ],
      },
      chat: {
        npc: "So, are you visiting, or do you live here?",
        replies: [
          { say: "I'm just visiting for a week.", match: [["visit", "trip", "holiday", "vacation", "tourist"]], next: "tip", xp: 10 },
          { say: "I live here. I just moved.", match: [["live", "moved", "local", "work"]], next: "tip", xp: 10 },
        ],
      },
      tip: {
        npc: "Nice! You should try the food trucks by the river. Okay, we're almost there. Where should I stop?",
        replies: [
          { say: "You can drop me here, thanks.", match: [["here", "drop", "stop", "corner", "front"]], next: "fare", xp: 10 },
        ],
      },
      fare: {
        npc: "That's eighteen dollars, please.",
        replies: [
          { say: "Here's twenty. Keep the change.", match: [["keep", "change", "twenty"]], next: "bye", xp: 15 },
          { say: "Can I pay by card?", match: [["card", "phone"]], next: "bye", xp: 10 },
        ],
      },
      bye: {
        npc: "Thank you, {name}! Enjoy your day.",
        end: true,
      },
    },
  },
  {
    id: "restaurant",
    objectives: [{"label": "Get a table", "reach": ["seat"]}, {"label": "Order your meal", "reach": ["allergy"]}, {"label": "Fix the wrong order", "reach": ["fix"]}, {"label": "Ask for the bill", "reach": ["bye"]}],
    name: "Luna Bistro",
    emoji: "🍝",
    color: "#ef4444",
    pos: { x: 17, y: 55 },
    unlock: 150,
    level: "Intermediate",
    goal: "Get a table, order a meal and handle a mistake politely.",
    npc: { name: "Sofia", avatar: "👩🏼", role: "Waiter", pitch: 1.1, rate: 1 },
    vocab: ["a table for two", "I'm allergic to…", "Excuse me, I think there's a mistake.", "Could we get the bill?"],
    start: "hello",
    nodes: {
      hello: {
        npc: "Good evening, welcome to Luna. Do you have a reservation?",
        replies: [
          { say: "Yes, it's under {name}.", match: [["yes", "under", "reservation", "booked"]], next: "seat", xp: 10 },
          { say: "No. Do you have a table for two?", match: [["no", "table", "two", "one"]], next: "seat", xp: 10 },
        ],
      },
      seat: {
        npc: "Right this way. Here's the menu. Can I start you off with something to drink?",
        replies: [
          { say: "Just water, please.", match: [["water"]], next: "order", xp: 10 },
          { say: "Could I see the wine list?", match: [["wine", "list"]], next: "order", xp: 10 },
          { say: "A lemonade, please.", match: [["lemonade", "juice", "soda", "coke"]], next: "order", xp: 10 },
        ],
      },
      order: {
        npc: "Are you ready to order, or do you need a few minutes?",
        replies: [
          { say: "I'll have the mushroom risotto.", match: [["risotto", "mushroom"]], next: "allergy", xp: 10 },
          { say: "I'd like the spaghetti, please.", match: [["spaghetti", "pasta"]], next: "allergy", xp: 10 },
          { say: "What's the special today?", match: [["special"]], next: "special", xp: 15 },
        ],
      },
      special: {
        npc: "Tonight's special is grilled salmon with lemon butter and vegetables.",
        replies: [
          { say: "That sounds great. I'll have that.", match: [["sounds", "have", "take", "yes", "great"]], next: "allergy", xp: 10 },
          { say: "I'll have the spaghetti instead.", match: [["spaghetti", "pasta", "instead", "risotto"]], next: "allergy", xp: 10 },
        ],
      },
      allergy: {
        npc: "Excellent choice. Do you have any allergies I should tell the chef about?",
        tip: "\"I'm allergic to…\" is important to know when travelling.",
        replies: [
          { say: "I'm allergic to nuts.", match: [["allergic", "allergy", "nut", "dairy", "gluten", "shellfish"]], next: "mistake", xp: 15 },
          { say: "No, no allergies.", match: [["no", "none", "nothing"]], next: "mistake", xp: 10 },
        ],
      },
      mistake: {
        npc: "(a few minutes later) Here you are! One chicken burger.",
        tip: "That's not what you ordered! Say so politely.",
        replies: [
          { say: "Excuse me, I think there's a mistake. I didn't order this.", match: [["mistake", "didn't", "did not", "wrong", "not mine", "not what"]], next: "fix", xp: 25 },
        ],
      },
      fix: {
        npc: "Oh, I'm so sorry! I'll bring your dish right away. Dessert is on us tonight.",
        replies: [
          { say: "No problem, thank you!", match: [["problem", "thank", "okay", "worries", "fine"]], next: "bill", xp: 10 },
        ],
      },
      bill: {
        npc: "(later) How was everything?",
        replies: [
          { say: "Delicious! Could we get the bill, please?", match: [["bill", "check"]], next: "bye", xp: 15 },
          { say: "It was great, thanks.", match: [["great", "delicious", "good", "amazing", "lovely"]], next: "bye", xp: 10 },
        ],
      },
      bye: {
        npc: "So glad you enjoyed it. Thank you for coming, {name}. Good night!",
        end: true,
      },
    },
  },
  {
    id: "hotel",
    objectives: [{"label": "Check in", "reach": ["room"]}, {"label": "Ask about the hotel", "reach": ["problem"]}, {"label": "Report a problem", "reach": ["fixit"]}, {"label": "Wrap up the call", "reach": ["bye"]}],
    name: "Grand Hotel",
    emoji: "🏨",
    color: "#8b5cf6",
    pos: { x: 50, y: 55 },
    unlock: 230,
    level: "Intermediate",
    goal: "Check in, ask about breakfast and report a problem.",
    npc: { name: "James", avatar: "🧑🏻‍💼", role: "Receptionist", pitch: 1, rate: 0.95 },
    vocab: ["I have a booking under…", "What time is breakfast?", "The Wi-Fi isn't working.", "Could I get a late checkout?"],
    start: "hello",
    nodes: {
      hello: {
        npc: "Good afternoon, welcome to the Grand Hotel. Are you checking in?",
        replies: [
          { say: "Yes, I have a booking under {name}.", match: [["yes", "booking", "reservation", "check"]], next: "id", xp: 10 },
        ],
      },
      id: {
        npc: "Lovely. Could I see your passport or ID, please?",
        replies: [
          { say: "Sure, here you go.", match: [["sure", "here", "yes", "of course"]], next: "room", xp: 10 },
        ],
      },
      room: {
        npc: "Thank you. You're in room four-oh-two, on the fourth floor. Here's your key card. Any questions?",
        replies: [
          { say: "What time is breakfast?", match: [["breakfast"]], next: "breakfast", xp: 15 },
          { say: "What's the Wi-Fi password?", match: [["wifi", "wi-fi", "internet", "password"]], next: "wifi", xp: 15 },
          { say: "No, that's everything. Thanks!", match: [["no", "everything", "that's all"]], next: "problem", xp: 10 },
        ],
      },
      breakfast: {
        npc: "Breakfast is served from seven to ten in the restaurant downstairs.",
        replies: [
          { say: "Great. And what's the Wi-Fi password?", match: [["wifi", "wi-fi", "internet", "password"]], next: "wifi", xp: 10 },
          { say: "Perfect, thank you.", match: [["perfect", "thank", "great"]], next: "problem", xp: 10 },
        ],
      },
      wifi: {
        npc: "It's on the back of your key card. Enjoy your stay!",
        replies: [
          { say: "Thank you very much.", match: [["thank", "great", "perfect"]], next: "problem", xp: 10 },
        ],
      },
      problem: {
        npc: "(the next morning, on the phone) Front desk, James speaking. How can I help?",
        tip: "Describe a problem: \"The … isn't working.\"",
        replies: [
          { say: "Hi, the air conditioning isn't working in my room.", match: [["not working", "isn't working", "broken", "doesn't work", "problem"]], next: "fixit", xp: 20 },
          { say: "Could I get some extra towels, please?", match: [["towel", "pillow", "blanket"]], next: "fixit", xp: 15 },
        ],
      },
      fixit: {
        npc: "I'm sorry about that. I'll send someone up in ten minutes. Anything else?",
        replies: [
          { say: "Could I get a late checkout tomorrow?", match: [["late", "checkout", "check out"]], next: "late", xp: 20 },
          { say: "No, that's all. Thank you.", match: [["no", "all", "thank"]], next: "bye", xp: 10 },
        ],
      },
      late: {
        npc: "Of course. I've set your checkout to one p.m. at no extra cost.",
        replies: [
          { say: "Amazing, thank you so much!", match: [["thank", "amazing", "great", "perfect"]], next: "bye", xp: 10 },
        ],
      },
      bye: {
        npc: "You're very welcome, {name}. Enjoy the rest of your stay.",
        end: true,
      },
    },
  },
  {
    id: "doctor",
    objectives: [{"label": "Describe your symptoms", "reach": ["fever"]}, {"label": "Answer the doctor", "reach": ["check"]}, {"label": "Ask about the medicine", "reach": ["often"]}, {"label": "Thank the doctor", "reach": ["bye"]}],
    name: "City Clinic",
    emoji: "🏥",
    color: "#06b6d4",
    pos: { x: 83, y: 55 },
    unlock: 320,
    level: "Intermediate",
    goal: "Describe how you feel and understand the advice.",
    npc: { name: "Dr. Chen", avatar: "👩🏻‍⚕️", role: "Doctor", pitch: 1.05, rate: 0.9 },
    vocab: ["I've had a … for two days.", "It hurts when…", "Do I need a prescription?", "How often should I take it?"],
    start: "hello",
    nodes: {
      hello: {
        npc: "Hello, I'm Doctor Chen. What brings you in today?",
        replies: [
          { say: "I've had a sore throat for two days.", match: [["throat"]], next: "fever", xp: 15 },
          { say: "I have a really bad headache.", match: [["head", "headache", "migraine"]], next: "fever", xp: 15 },
          { say: "My stomach hurts.", match: [["stomach", "belly", "tummy"]], next: "fever", xp: 15 },
        ],
      },
      fever: {
        npc: "I see. Do you have a fever, or are you feeling tired?",
        replies: [
          { say: "Yes, I have a slight fever.", match: [["fever", "temperature", "hot"]], next: "check", xp: 10 },
          { say: "No fever, but I'm very tired.", match: [["tired", "no", "exhausted", "sleepy"]], next: "check", xp: 10 },
        ],
      },
      check: {
        npc: "Let me take a look. Okay. It looks like a mild infection. Nothing serious.",
        replies: [
          { say: "Do I need a prescription?", match: [["prescription", "medicine", "medication", "pills"]], next: "rx", xp: 15 },
          { say: "That's a relief. What should I do?", match: [["relief", "what should", "what do", "do"]], next: "rx", xp: 10 },
        ],
      },
      rx: {
        npc: "I'll give you some medicine. Take one tablet with food.",
        tip: "Ask for details: \"How often…?\", \"For how long…?\"",
        replies: [
          { say: "How often should I take it?", match: [["how often", "how many", "times"]], next: "often", xp: 20 },
          { say: "For how long?", match: [["how long", "days"]], next: "often", xp: 20 },
        ],
      },
      often: {
        npc: "Twice a day, morning and evening, for five days. Drink lots of water and get some rest.",
        replies: [
          { say: "Okay, thank you, doctor.", match: [["thank", "okay", "ok", "got it"]], next: "bye", xp: 10 },
        ],
      },
      bye: {
        npc: "You're welcome. Feel better soon, {name}!",
        end: true,
      },
    },
  },
  {
    id: "airport",
    objectives: [{"label": "Say where you're flying", "reach": ["bags"]}, {"label": "Check bags and pick a seat", "reach": ["delay"]}, {"label": "Handle the delay", "reach": ["gate"]}],
    name: "Skyport Airport",
    emoji: "✈️",
    color: "#3b82f6",
    pos: { x: 17, y: 88 },
    unlock: 420,
    level: "Advanced",
    goal: "Check in for your flight and handle a delay.",
    npc: { name: "Lena", avatar: "👩🏾‍✈️", role: "Check-in agent", pitch: 1.1, rate: 1.05 },
    vocab: ["window / aisle seat", "carry-on / checked bag", "My flight was delayed.", "connecting flight"],
    start: "hello",
    nodes: {
      hello: {
        npc: "Hi, where are you flying to today?",
        replies: [
          { say: "I'm flying to London.", match: [["london"]], next: "bags", xp: 10 },
          { say: "I'm going to Tokyo.", match: [["tokyo"]], next: "bags", xp: 10 },
          { say: "New York, please.", match: [["new york"]], next: "bags", xp: 10 },
        ],
      },
      bags: {
        npc: "Great. Can I have your passport? And are you checking any bags today?",
        replies: [
          { say: "Yes, one suitcase to check.", match: [["one", "suitcase", "yes", "bag"]], next: "seat", xp: 10 },
          { say: "No, just a carry-on.", match: [["no", "carry", "hand", "just"]], next: "seat", xp: 10 },
        ],
      },
      seat: {
        npc: "All set. Would you prefer a window or an aisle seat?",
        replies: [
          { say: "A window seat, please.", match: [["window"]], next: "delay", xp: 10 },
          { say: "Aisle, please.", match: [["aisle"]], next: "delay", xp: 10 },
        ],
      },
      delay: {
        npc: "Hmm, I'm afraid your flight is delayed by three hours.",
        tip: "Stay calm and ask what your options are.",
        replies: [
          { say: "Oh no. I have a connecting flight. What are my options?", match: [["connect", "option", "what can", "other flight"]], next: "rebook", xp: 25 },
          { say: "Will I get a meal voucher?", match: [["voucher", "meal", "food", "compensation"]], next: "voucher", xp: 20 },
        ],
      },
      rebook: {
        npc: "I can rebook you on an earlier flight with a different airline. It leaves in ninety minutes.",
        replies: [
          { say: "Yes, please rebook me.", match: [["yes", "rebook", "please", "great", "perfect"]], next: "gate", xp: 15 },
        ],
      },
      voucher: {
        npc: "Yes, here's a twenty dollar meal voucher for the food court.",
        replies: [
          { say: "Thank you. Which gate do I go to?", match: [["gate", "where"]], next: "gate", xp: 15 },
          { say: "Thanks, that helps.", match: [["thank", "helps", "great"]], next: "gate", xp: 10 },
        ],
      },
      gate: {
        npc: "You're at gate B twelve. Boarding starts forty minutes before departure. Have a safe flight, {name}!",
        end: true,
      },
    },
  },
  {
    id: "office",
    objectives: [{"label": "Introduce yourself", "reach": ["strength"]}, {"label": "Talk about strengths and weaknesses", "reach": ["why"]}, {"label": "Say why you want the job", "reach": ["questions"]}, {"label": "Ask a question", "reach": ["answer"]}],
    name: "Startup HQ",
    emoji: "💼",
    color: "#ec4899",
    pos: { x: 50, y: 88 },
    unlock: 540,
    level: "Advanced",
    goal: "Ace a job interview: introduce yourself, give strengths, ask a question.",
    npc: { name: "Marcus", avatar: "👨🏿‍💼", role: "Hiring manager", pitch: 0.9, rate: 1 },
    vocab: ["I have experience in…", "One of my strengths is…", "I'm passionate about…", "What does a typical day look like?"],
    start: "hello",
    nodes: {
      hello: {
        npc: "Hi {name}, thanks for coming in. Let's start simple: tell me a little about yourself.",
        tip: "Answer in your own words. Anything works!",
        any: "strength",
        replies: [
          { say: "I'm a designer with three years of experience in mobile apps.", match: [["experience", "years", "work", "studied", "graduate"]], next: "strength", xp: 20 },
        ],
      },
      strength: {
        npc: "Great. What would you say is your biggest strength?",
        any: "weakness",
        replies: [
          { say: "One of my strengths is that I learn really quickly.", match: [["strength", "good at", "learn", "team", "creative", "organized", "hard"]], next: "weakness", xp: 20 },
        ],
      },
      weakness: {
        npc: "And something you're working on improving?",
        tip: "Mention a weakness, then say how you're improving it.",
        any: "why",
        replies: [
          { say: "I sometimes take on too much, so I'm learning to prioritise.", match: [["improv", "learning", "working on", "sometimes", "weakness"]], next: "why", xp: 20 },
        ],
      },
      why: {
        npc: "Honest answer, I like that. Why do you want to work here?",
        any: "questions",
        replies: [
          { say: "I'm passionate about your product and I love your team culture.", match: [["passionate", "love", "product", "mission", "culture", "excited", "grow"]], next: "questions", xp: 20 },
        ],
      },
      questions: {
        npc: "Fantastic. Do you have any questions for me?",
        tip: "Always ask a question at the end of an interview!",
        replies: [
          { say: "What does a typical day look like?", match: [["typical", "day", "daily"]], next: "answer", xp: 25 },
          { say: "What are the next steps?", match: [["next step", "next", "process", "hear back"]], next: "answer", xp: 25 },
          { say: "No, I think you've covered everything.", match: [["no", "covered", "everything"]], next: "answer", xp: 5 },
        ],
      },
      answer: {
        npc: "Great question. Lots of teamwork, quick meetings, and real ownership. We'll be in touch by Friday. Really nice to meet you, {name}!",
        end: true,
      },
    },
  },
  {
    id: "party",
    objectives: [{"label": "Introduce yourself", "reach": ["host"]}, {"label": "Make small talk", "reach": ["hobby"]}, {"label": "Make plans to meet again", "reach": ["bye"]}],
    name: "Rooftop Party",
    emoji: "🎉",
    color: "#f97316",
    pos: { x: 83, y: 88 },
    unlock: 660,
    level: "Advanced",
    goal: "Make small talk with a stranger and swap contacts.",
    npc: { name: "Alex", avatar: "🧑🏼‍🎤", role: "Party guest", pitch: 1.05, rate: 1.1 },
    vocab: ["How do you know the host?", "What do you do?", "No way!", "We should hang out sometime."],
    start: "hello",
    nodes: {
      hello: {
        npc: "Hey! I don't think we've met. I'm Alex.",
        replies: [
          { say: "Nice to meet you, I'm {name}.", match: [["nice", "meet", "i'm", "my name", "hi", "hey"]], next: "host", xp: 10 },
        ],
      },
      host: {
        npc: "So how do you know Sam, the host?",
        any: "job",
        replies: [
          { say: "We work together. How about you?", match: [["work", "together", "colleague"]], next: "job", xp: 15 },
          { say: "We went to university together.", match: [["school", "university", "college", "class"]], next: "job", xp: 15 },
          { say: "Actually, I'm a friend of a friend.", match: [["friend"]], next: "job", xp: 15 },
        ],
      },
      job: {
        npc: "Oh cool! I'm Sam's neighbour. So what do you do?",
        any: "hobby",
        replies: [
          { say: "I'm a student. I study computer science.", match: [["student", "study", "studying"]], next: "hobby", xp: 15 },
          { say: "I work in marketing. What about you?", match: [["work", "job", "i'm a"]], next: "hobby", xp: 15 },
        ],
      },
      hobby: {
        npc: "Nice. I'm a music producer, actually. What do you like to do for fun?",
        any: "contact",
        replies: [
          { say: "No way! I love music. I play the guitar.", match: [["music", "guitar", "piano", "sing"]], next: "contact", xp: 20 },
          { say: "I'm really into hiking and cooking.", match: [["into", "love", "like", "enjoy", "hiking", "cooking", "games"]], next: "contact", xp: 15 },
        ],
      },
      contact: {
        npc: "That's awesome. Hey, a few of us are going to a concert next week. Want to come?",
        replies: [
          { say: "I'd love to! Let's swap numbers.", match: [["love", "yes", "sure", "number", "instagram", "contact", "definitely"]], next: "bye", xp: 20 },
          { say: "Maybe! We should hang out sometime.", match: [["maybe", "sometime", "hang out", "let me know"]], next: "bye", xp: 15 },
        ],
      },
      bye: {
        npc: "Sweet! Great chatting with you, {name}. I'll text you the details.",
        end: true,
      },
    },
  },
];
