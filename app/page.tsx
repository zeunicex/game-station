"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type GameKey = "zoom" | "bible" | "hymn";
type Screen = "home" | "menu" | "category" | "briefing" | "play" | "result" | "scoreboard";
type ClueToken = { type: "emoji"; value: string } | { type: "image"; src: string; alt: string };
type Question = {
  id: string;
  visual?: string;
  clueLines?: ClueToken[][];
  image?: string;
  answerImage?: string;
  prompt: string;
  answer: string;
  answerTitle?: string;
  answerLyrics?: string;
  hint?: string;
  clueScale?: number;
  cluePosition?: string;
};
type Scores = Record<GameKey, number>;
type HintCounts = { zoom: number; round2: number };
type Round2Key = "bible" | "hymn";
type Round2State = {
  queue: string[];
  completed: number;
  revealed: boolean;
  locked: boolean;
};
type Round2Progress = Record<Round2Key, Round2State>;
type TeamRecord = {
  id: string;
  team: string;
  scores: Scores;
  total: number;
  completedAt: string;
};

const roundSeconds = 300;
const storageKey = "game-station-team-records";
const imageVersion = "v20260806-4";

const emptyScores: Scores = { zoom: 0, bible: 0, hymn: 0 };
const startingHints: HintCounts = { zoom: 5, round2: 5 };
const emptyRound2Progress: Round2Progress = {
  bible: { queue: [], completed: 0, revealed: false, locked: false },
  hymn: { queue: [], completed: 0, revealed: false, locked: false },
};

const questions: Record<GameKey, Question[]> = {
  zoom: [
    { id: "z1", image: "/questions/zoom/ikea-zoom.jpg", answerImage: "/questions/zoom/ikea-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "IKEA" },
    { id: "z2", image: "/questions/zoom/palm-zoom.jpg", answerImage: "/questions/zoom/palm-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "Palm tree", clueScale: 1.45 },
    { id: "z3", image: "/questions/zoom/tennis-ball-zoom.jpg", answerImage: "/questions/zoom/tennis-ball-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "Tennis ball" },
    { id: "z4", image: "/questions/zoom/green-drink-zoom.jpg", answerImage: "/questions/zoom/green-drink-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "Matcha", clueScale: 1.5 },
    { id: "z5", image: "/questions/zoom/watermelon-zoom.jpg", answerImage: "/questions/zoom/watermelon-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "Watermelon", clueScale: 2.1, cluePosition: "48% 52%" },
    { id: "z6", image: "/questions/zoom/cake-zoom.jpg", answerImage: "/questions/zoom/cake-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "Birthday cake" },
    { id: "z7", image: "/questions/zoom/bird-zoom.jpg", answerImage: "/questions/zoom/bird-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "Bird" },
    { id: "z8", image: "/questions/zoom/deer-zoom.jpg", answerImage: "/questions/zoom/deer-answer.png", prompt: "What is this zoomed-in picture?", answer: "Deer" },
    { id: "z9", image: "/questions/zoom/fireworks-zoom.jpg", answerImage: "/questions/zoom/fireworks-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "Fireworks", clueScale: 2.15, cluePosition: "52% 42%" },
    { id: "z10", image: "/questions/zoom/gardens-zoom.jpg", answerImage: "/questions/zoom/gardens-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "Gardens by the Bay", clueScale: 1.8, cluePosition: "52% 58%" },
    { id: "z11", image: "/questions/zoom/pineapple-zoom.jpg", answerImage: "/questions/zoom/pineapple-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "Pineapple" },
    { id: "z12", image: "/questions/zoom/keyboard-zoom.jpg", answerImage: "/questions/zoom/keyboard-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "Keyboard" },
    { id: "z13", image: "/questions/zoom/padlock-zoom.jpg", answerImage: "/questions/zoom/padlock-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "Padlock" },
    { id: "z14", image: "/questions/zoom/recovery-bible-zoom.jpg", answerImage: "/questions/zoom/recovery-bible-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "Recovery Version Bible" },
    { id: "z15", image: "/questions/zoom/camera-lens-zoom.jpg", answerImage: "/questions/zoom/camera-lens-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "Camera lens" },
    { id: "z16", image: "/questions/zoom/shoe-sole-zoom.jpg", answerImage: "/questions/zoom/shoe-sole-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "Shoe sole", clueScale: 1.4 },
    { id: "z17", image: "/questions/zoom/orange-zoom.jpg", answerImage: "/questions/zoom/orange-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "Orange peel" },
    { id: "z18", image: "/questions/zoom/microphone-zoom.jpg", answerImage: "/questions/zoom/microphone-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "Microphone", clueScale: 1.45 },
    { id: "z19", image: "/questions/zoom/guitar-zoom.jpg", answerImage: "/questions/zoom/guitar-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "Guitar strings" },
    { id: "z20", image: "/questions/zoom/sponge-zoom.jpg", answerImage: "/questions/zoom/sponge-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "Sponge" },
    { id: "z21", image: "/questions/zoom/can-opener-zoom.png", answerImage: "/questions/zoom/can-opener-answer.png", prompt: "What is this zoomed-in picture?", answer: "Can opener" },
    { id: "z22", image: "/questions/zoom/zipper-zoom.jpg", answerImage: "/questions/zoom/zipper-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "Zipper" },
    { id: "z23", image: "/questions/zoom/pencil-tip-zoom.jpg", answerImage: "/questions/zoom/pencil-tip-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "Pencil tip", clueScale: 2.35, cluePosition: "50% 47%" },
    { id: "z24", image: "/questions/zoom/stapler-zoom.jpg", answerImage: "/questions/zoom/stapler-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "Stapler" },
    { id: "z25", image: "/questions/zoom/airpods-case-zoom.jpg", answerImage: "/questions/zoom/airpods-case-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "Earbuds case", clueScale: 1.9, cluePosition: "52% 50%" },
    { id: "z26", image: "/questions/zoom/pinecone-zoom.jpg", answerImage: "/questions/zoom/pinecone-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "Pinecone", clueScale: 1.9, cluePosition: "50% 53%" },
    { id: "z27", image: "/questions/zoom/honeycomb-zoom.jpg", answerImage: "/questions/zoom/honeycomb-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "Honeycomb", clueScale: 1.85, cluePosition: "50% 50%" },
    { id: "z28", image: "/questions/zoom/toothpaste-zoom.jpg", answerImage: "/questions/zoom/toothpaste-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "Toothbrush" },
    { id: "z29", image: "/questions/zoom/corn-zoom.jpg", answerImage: "/questions/zoom/corn-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "Corn", clueScale: 2.25, cluePosition: "50% 52%" },
    { id: "z30", image: "/questions/zoom/sushi-roll-zoom.jpg", answerImage: "/questions/zoom/sushi-roll-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "Sushi roll", clueScale: 1.85, cluePosition: "52% 50%" },
    { id: "z31", image: "/questions/zoom/book-pages-zoom.jpg", answerImage: "/questions/zoom/book-pages-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "Book pages" },
    { id: "z32", image: "/questions/zoom/sewing-needle-zoom.jpg", answerImage: "/questions/zoom/sewing-needle-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "Sewing needle" },
    { id: "z33", image: "/questions/zoom/shower-head-answer.png", answerImage: "/questions/zoom/shower-head-answer.png", prompt: "What is this zoomed-in picture?", answer: "Shower head", clueScale: 4.8, cluePosition: "52% 48%" },
    { id: "z34", image: "/questions/zoom/usb-drive-answer.png", answerImage: "/questions/zoom/usb-drive-answer.png", prompt: "What is this zoomed-in picture?", answer: "USB flash drive", clueScale: 8, cluePosition: "65% 58%" },
    { id: "z35", image: "/questions/zoom/chess-knight-zoom.png", answerImage: "/questions/zoom/chess-knight-answer.png", prompt: "What is this zoomed-in picture?", answer: "Chess knight" },
    { id: "z36", image: "/questions/zoom/garlic-press-answer.png", answerImage: "/questions/zoom/garlic-press-answer.png", prompt: "What is this zoomed-in picture?", answer: "Garlic press", clueScale: 5, cluePosition: "31% 67%" },
    { id: "z37", image: "/questions/zoom/binder-clip-clue.png", answerImage: "/questions/zoom/binder-clip-answer.png", prompt: "What is this zoomed-in picture?", answer: "Binder clip", clueScale: 1.35 },
    { id: "z38", image: "/questions/zoom/corkscrew-answer.png", answerImage: "/questions/zoom/corkscrew-answer.png", prompt: "What is this zoomed-in picture?", answer: "Corkscrew", clueScale: 7, cluePosition: "50% 62%" },
    { id: "z39", image: "/questions/zoom/adjustable-wrench-answer.png", answerImage: "/questions/zoom/adjustable-wrench-answer.png", prompt: "What is this zoomed-in picture?", answer: "Adjustable wrench", clueScale: 7, cluePosition: "50% 27%" },
    { id: "z40", image: "/questions/zoom/key-answer.png", answerImage: "/questions/zoom/key-answer.png", prompt: "What is this zoomed-in picture?", answer: "Key", clueScale: 7.5, cluePosition: "67% 59%" },
    { id: "z41", image: "/questions/zoom/salt-shaker-answer.png", answerImage: "/questions/zoom/salt-shaker-answer.png", prompt: "What is this zoomed-in picture?", answer: "Salt shaker", clueScale: 7, cluePosition: "50% 25%" },
    { id: "z42", image: "/questions/zoom/spiral-notebook-clue.png", answerImage: "/questions/zoom/spiral-notebook-answer.png", prompt: "What is this zoomed-in picture?", answer: "Spiral notebook", clueScale: 2.8, cluePosition: "48% 50%" },
    { id: "z43", image: "/questions/zoom/door-hinge-answer.png", answerImage: "/questions/zoom/door-hinge-answer.png", prompt: "What is this zoomed-in picture?", answer: "Door hinge", clueScale: 5, cluePosition: "50% 50%" },
    { id: "z44", image: "/questions/zoom/potato-masher-answer.png", answerImage: "/questions/zoom/potato-masher-answer.png", prompt: "What is this zoomed-in picture?", answer: "Potato masher", clueScale: 2, cluePosition: "50% 100%" },
    { id: "z45", image: "/questions/zoom/sunflower-answer.png", answerImage: "/questions/zoom/sunflower-answer.png", prompt: "What is this zoomed-in picture?", answer: "Sunflower", clueScale: 4.2, cluePosition: "51% 50%" },
    { id: "z46", image: "/questions/zoom/colander-answer.png", answerImage: "/questions/zoom/colander-answer.png", prompt: "What is this zoomed-in picture?", answer: "Colander", clueScale: 5.4, cluePosition: "50% 48%" },
    { id: "z47", image: "/questions/zoom/bicycle-pedal-answer.png", answerImage: "/questions/zoom/bicycle-pedal-answer.png", prompt: "What is this zoomed-in picture?", answer: "Bicycle pedal", clueScale: 2.6 },
    { id: "z48", image: "/questions/zoom/safety-pin-clue.png", answerImage: "/questions/zoom/safety-pin-answer.png", prompt: "What is this zoomed-in picture?", answer: "Safety pin", clueScale: 1.65, cluePosition: "42% 52%" },
    { id: "z49", image: "/questions/zoom/clothespin-answer.png", answerImage: "/questions/zoom/clothespin-answer.png", prompt: "What is this zoomed-in picture?", answer: "Clothespin", clueScale: 7, cluePosition: "50% 58%" },
    { id: "z50", image: "/questions/zoom/pepper-grinder-answer.png", answerImage: "/questions/zoom/pepper-grinder-answer.png", prompt: "What is this zoomed-in picture?", answer: "Pepper grinder", clueScale: 5.5, cluePosition: "50% 24%" },
    { id: "z51", image: "/questions/zoom/comb-teeth-zoom.jpg", answerImage: "/questions/zoom/comb-teeth-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "Comb teeth" },
    { id: "z52", image: "/questions/zoom/cork-coaster-zoom.jpg", answerImage: "/questions/zoom/cork-coaster-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "Cork coaster" },
    { id: "z53", image: "/questions/zoom/walnut-shell-zoom.jpg", answerImage: "/questions/zoom/walnut-shell-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "Walnut shell" },
    { id: "z54", image: "/questions/zoom/fork-tines-zoom.jpg", answerImage: "/questions/zoom/fork-tines-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "Fork tines" },
    { id: "z55", image: "/questions/zoom/paper-clips-zoom.jpg", answerImage: "/questions/zoom/paper-clips-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "Paper clips" },
    { id: "z56", image: "/questions/zoom/shirt-button-zoom.jpg", answerImage: "/questions/zoom/shirt-button-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "Shirt button" },
    { id: "z57", image: "/questions/zoom/coffee-beans-zoom.jpg", answerImage: "/questions/zoom/coffee-beans-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "Coffee beans" },
    { id: "z58", image: "/questions/zoom/denim-fabric-zoom.jpg", answerImage: "/questions/zoom/denim-fabric-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "Denim fabric" },
    { id: "z59", image: "/questions/zoom/bottle-opener-zoom.jpg", answerImage: "/questions/zoom/bottle-opener-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "Bottle opener" },
    { id: "z60", image: "/questions/zoom/cinnamon-stick-zoom.jpg", answerImage: "/questions/zoom/cinnamon-stick-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "Cinnamon stick" },
    { id: "z61", image: "/questions/zoom/strawberry-zoom.jpg", answerImage: "/questions/zoom/strawberry-answer.jpg", prompt: "What is this zoomed-in picture?", answer: "Strawberry" },
  ],
  bible: [
    { id: "b1", clueLines: [
      [{ type: "emoji", value: "👩" }, { type: "emoji", value: "🫙" }, { type: "emoji", value: "🫙" }, { type: "image", src: "/questions/hymn/olive-oil.png", alt: "Oil" }, { type: "image", src: "/questions/hymn/olive-oil.png", alt: "Oil" }],
    ], prompt: "Which Bible story do these picture clues show?", answer: "The Widow's Oil", answerTitle: "The Widow's Oil", answerLyrics: `2 Kings 4:1 Now a certain woman from among the wives of the sons of the prophets cried out to Elisha, saying, Your servant my husband is dead, and you know that your servant feared Jehovah. And the creditor has come to take my two children to himself as servants.
2 Kings 4:2 And Elisha said to her, What shall I do for you? Tell me, what do you have in your house? And she said, Your servant has nothing at all in the house, except a jar of oil.
2 Kings 4:3 And he said, Go and borrow vessels outside, from all your neighbors, empty vessels, and not just a few.
2 Kings 4:4 Then go in and shut the door behind you and your sons, and pour out into all those vessels; and each one you fill set aside.
2 Kings 4:5 So she went away from him and shut the door behind herself and her sons; and they brought the vessels to her, and she poured out into them.
2 Kings 4:6 And when she had filled the vessels, she said to her son, Bring me another vessel. But he said to her, There is no other vessel. And the oil stopped.
2 Kings 4:7 And she went and told the man of God. And he said, Go and sell the oil, and pay your debt; and you and your sons can live off the rest.` },
    { id: "b2", clueLines: [
      [{ type: "image", src: "/questions/bible/gold.png", alt: "Gold" }, { type: "image", src: "/questions/bible/golden-image.png", alt: "Image" }, { type: "emoji", value: "🔥" }, { type: "emoji", value: "🧍‍♂️" }, { type: "emoji", value: "🧍‍♂️" }, { type: "emoji", value: "🧍‍♂️" }],
    ], prompt: "Which Bible story do these picture clues show?", answer: "Daniel's Friends in the Furnace", answerTitle: "Daniel's Friends in the Furnace", answerLyrics: `Dan. 3:14 Nebuchadnezzar responded and said to them, Do you, Shadrach, Meshach, and Abed-nego, purposely not serve my gods nor worship the golden image that I have set up?
Dan. 3:15 Now then, if, at the time when you hear the sound of the horn, flute, lyre, trigon, psaltery, bagpipe, and all kinds of music, you are ready to fall down and worship the image that I have made, very well; but if you do not worship, you will be thrown into the midst of a blazing furnace of fire in that very hour.
Dan. 3:16 Shadrach, Meshach, and Abed-nego answered and said to the king, O Nebuchadnezzar, there is no need for us to give you an answer in this matter.
Dan. 3:17 If it be so, our God whom we serve is able to deliver us from the blazing furnace of fire, and He will deliver us out of your hand, O king.
Dan. 3:18 But if He does not, let it be known to you, O king, that we will not serve your gods nor worship the golden image that you have set up.
Dan. 3:23 And these three men, Shadrach, Meshach, and Abed-nego, fell into the midst of the blazing furnace of fire bound up.
Dan. 3:25 He answered and said, Look, I see four men loose, walking in the midst of the fire; and they are not harmed. And the appearance of the fourth is like a son of the gods.
Dan. 3:27 They saw concerning these men that the fire had no effect on their bodies and that the hair of their heads was not singed, nor had their clothes been affected, nor had the smell of fire come upon them.` },
    { id: "b3", clueLines: [
      [{ type: "emoji", value: "🛣️" }, { type: "image", src: "/questions/bible/chariot.png", alt: "Chariot" }, { type: "emoji", value: "📖" }, { type: "emoji", value: "💦" }, { type: "image", src: "/questions/bible/baptism.png", alt: "Baptism" }],
    ], prompt: "Which Bible story do these picture clues show?", answer: "Philip Baptizes the Ethiopian Eunuch", answerTitle: "Philip Baptizes the Ethiopian Eunuch", answerLyrics: `Acts 8:26 But an angel of the Lord spoke to Philip, saying, Rise up and go south on the road that goes down from Jerusalem to Gaza. This is the desert route.
Acts 8:27 And he rose up and went. And behold, an Ethiopian man, a eunuch, a man in power under Candace, queen of the Ethiopians, who was over all her treasure, had come to Jerusalem to worship.
Acts 8:28 And he was returning and was sitting in his chariot and reading the prophet Isaiah.
Acts 8:29 And the Spirit said to Philip, Approach and join this chariot.
Acts 8:30 And when Philip ran up, he heard him reading Isaiah the prophet and said, Do you really know the things that you are reading?
Acts 8:35 And Philip opened his mouth, and beginning from this Scripture he announced Jesus as the gospel to him.
Acts 8:36 And as they were going along the road, they came upon some water, and the eunuch said, Look, water. What prevents me from being baptized?
Acts 8:38 And he ordered the chariot to stand still, and they both went down into the water, Philip and the eunuch, and he baptized him.
Acts 8:39 And when they came up out of the water, the Spirit of the Lord caught Philip away; and the eunuch did not see him anymore, for he went on his way rejoicing.` },
    { id: "b4", clueLines: [
      [{ type: "emoji", value: "🛣️" }, { type: "emoji", value: "🚶‍♂️" }, { type: "emoji", value: "🚶‍♂️" }, { type: "emoji", value: "😔" }, { type: "emoji", value: "📖" }, { type: "emoji", value: "🍞" }, { type: "emoji", value: "👀" }, { type: "emoji", value: "🔥❤️" }],
    ], prompt: "Which Bible story do these picture clues show?", answer: "Jesus Appears to Two Disciples on the Road to Emmaus", answerTitle: "Jesus Appears to Two Disciples on the Road to Emmaus", answerLyrics: `Luke 24:13 And behold, two of them were going on the same day to a village named Emmaus, which was sixty stadia away from Jerusalem.
Luke 24:15 And while they were talking and discussing, Jesus Himself drew near and went with them.
Luke 24:16 But their eyes were kept from recognizing Him.
Luke 24:17 And He said to them, What are these words which you are exchanging with one another while you are walking? And they stood still, looking sad.
Luke 24:25 And He said to them, O foolish and slow of heart to believe in all that the prophets have spoken!
Luke 24:27 And beginning from Moses and from all the prophets, He explained to them clearly in all the Scriptures the things concerning Himself.
Luke 24:30 And as He reclined at table with them, He took the loaf and blessed it, and having broken it, He began handing it to them.
Luke 24:31 And their eyes were opened, and they recognized Him; and He disappeared from them.
Luke 24:32 And they said to one another, Was not our heart burning within us while He was speaking to us on the road, while He was opening to us the Scriptures?` },
    { id: "b5", clueLines: [
      [{ type: "emoji", value: "🫏" }, { type: "emoji", value: "🛑" }, { type: "emoji", value: "👼" }, { type: "emoji", value: "⚔️" }],
    ], prompt: "Which Bible story do these picture clues show?", answer: "Balaam's Donkey", answerTitle: "Balaam's Donkey", answerLyrics: `Num. 22:21 And Balaam rose up in the morning and saddled his donkey and went with the rulers of Moab.
Num. 22:22 And God's anger was kindled because he was going, and the Angel of Jehovah took His stand in the way as an adversary against him.
Num. 22:23 And when the donkey saw the Angel of Jehovah standing in the way with His drawn sword in His hand, the donkey turned aside out of the way and went into the field. And Balaam struck the donkey to turn her back into the way.
Num. 22:25 And when the donkey saw the Angel of Jehovah, she pressed herself against the wall and crushed Balaam's foot against the wall. So he struck her again.
Num. 22:27 And when the donkey saw the Angel of Jehovah, she lay down under Balaam. Then Balaam's anger was kindled, and he struck the donkey with his staff.
Num. 22:28 And Jehovah opened the mouth of the donkey, and she said to Balaam, What have I done to you, that you have struck me these three times?` },
    { id: "b6", clueLines: [
      [{ type: "emoji", value: "🌪️" }, { type: "image", src: "/questions/bible/earthquake-fire.png", alt: "Earthquake and fire" }, { type: "emoji", value: "🤫" }, { type: "emoji", value: "👂" }, { type: "image", src: "/questions/bible/low-volume.png", alt: "Gentle quiet voice" }],
    ], prompt: "Which Bible story do these picture clues show?", answer: "Elijah Hears the Still Small Voice", answerTitle: "Elijah Hears the Still Small Voice", answerLyrics: `1 Kings 19:9 And there he went into a cave and lodged there. And at that time the word of Jehovah came to him; and He said to him, What are you doing here, Elijah?
1 Kings 19:10 And he said, I have been very jealous for Jehovah the God of hosts; for the children of Israel have forsaken Your covenant, thrown down Your altars, and slain Your prophets with the sword; and I alone am left, and they seek to take my life.
1 Kings 19:11 And He said, Go out, and stand upon the mountain before Jehovah. And suddenly Jehovah passed by, and a great, strong wind rent the mountains and broke the rocks in pieces before Jehovah — Jehovah was not in the wind. And after the wind, an earthquake — Jehovah was not in the earthquake.
1 Kings 19:12 And after the earthquake, a fire — Jehovah was not in the fire. And after the fire, a gentle, quiet voice.
1 Kings 19:13 And when Elijah heard it, he wrapped his face in his mantle and went out and stood at the entrance of the cave. And then a voice came to him and said, What are you doing here, Elijah?` },
    { id: "b7", clueLines: [
      [{ type: "emoji", value: "🧍‍♂️" }, { type: "emoji", value: "🤒" }, { type: "emoji", value: "🌊" }, { type: "emoji", value: "7️⃣" }],
    ], prompt: "Which Bible story do these picture clues show?", answer: "Naaman Washed Seven Times", answerTitle: "Naaman Washed Seven Times", answerLyrics: `2 Kings 5:1 Now Naaman, the captain of the army of the king of Syria, was a great man in the sight of his master and highly respected, because by him Jehovah had given deliverance to Syria. But the man, though a mighty man of valor, was a leper.
2 Kings 5:2 And the Syrians had gone out in bands and had taken captive a little girl from the land of Israel, and she waited on Naaman's wife.
2 Kings 5:3 And she said to her mistress, If only my master were with the prophet who is in Samaria! Then he would cure him of his leprosy.
2 Kings 5:9 And Naaman came with his horses and his chariot and stood at the entrance of the house of Elisha.
2 Kings 5:10 And Elisha sent a messenger to him, saying, Go and wash in the Jordan seven times, and your flesh shall be restored; and you shall be clean.
2 Kings 5:11 But Naaman became furious and went away and said, I thought, He will surely come out to me and stand and call on the name of Jehovah his God, and wave his hand over the place and cure the leper.` },
  ],
  hymn: [
    { id: "h1", clueLines: [
      [{ type: "emoji", value: "🍇" }, { type: "emoji", value: "👊" }, { type: "emoji", value: "🍷" }],
      [{ type: "emoji", value: "🫒" }, { type: "emoji", value: "👊" }, { type: "image", src: "/questions/hymn/olive-oil.png", alt: "Olive oil" }],
    ], prompt: "Which hymn do these picture clues show?", answer: "Olives That Have Known No Pressure", answerTitle: "Olives That Have Known No Pressure", answerLyrics: `Olives that have known no pressure
No oil can bestow;
If the grapes escape the winepress,
Cheering wine can never flow;
Spikenard only through the crushing,
Fragrance can diffuse.
Shall I then, Lord, shrink from suff'ring
Which Thy love for me would choose?` },
    { id: "h2", clueLines: [
      [{ type: "emoji", value: "👇" }, { type: "image", src: "/questions/hymn/dungeon.png", alt: "Dungeon" }, { type: "emoji", value: "😔" }, { type: "emoji", value: "🩸" }, { type: "emoji", value: "🕊️" }],
    ], prompt: "Which hymn do these picture clues show?", answer: "In a Low Dungeon, Hope We Had None", answerTitle: "In a Low Dungeon, Hope We Had None", answerLyrics: `In a low dungeon, hope we had none;
Tried to believe, but faith didn't come;
God, our sky clearing, Jesus appearing,
We by God were transfused!
We by God were transfused!
Propitiation made by the blood,
Jesus' redemption bought us for God!
No condemnation, justification!
We have peace toward God!
We have peace toward God!` },
    { id: "h3", clueLines: [
      [{ type: "emoji", value: "\u{2B07}\u{FE0F}" }, { type: "emoji", value: "\u{2728}" }, { type: "emoji", value: "\u{1F4D6}" }],
      [{ type: "image", src: "/questions/hymn/manger.png", alt: "Manger" }, { type: "emoji", value: "\u{1F62D}" }, { type: "image", src: "/questions/hymn/thorns.png", alt: "Thorns" }],
    ], prompt: "Which hymn do these picture clues show?", answer: "Down from His Glory", answerTitle: "Down from His Glory", answerLyrics: `Down from His glory,
Ever living story,
My God and Savior came,
And Jesus was His name.
Born in a manger,
To His own a stranger,
A Man of sorrows, tears and agony.
O how I love Him! How I adore Him!
My breath, my sunshine, my all in all!
The great Creator became my Savior,
And all God's fulness dwelleth in Him.` },
    { id: "h4", clueLines: [
      [{ type: "emoji", value: "\u{2764}\u{FE0F}" }, { type: "image", src: "/questions/hymn/poured-bottle.png", alt: "Poured bottle" }, { type: "image", src: "/questions/hymn/accusing-person.png", alt: "Accusing person" }, { type: "image", src: "/questions/hymn/wasted-money.png", alt: "Wasted money" }],
    ], prompt: "Which hymn do these picture clues show?", answer: "Mary Poured Out Her Love Offering", answerTitle: "Mary Poured Out Her Love Offering", answerLyrics: `Mary poured out her love offering
To many such love was a waste.
Throughout all of the centuries
Such lovers Your sweetness do taste.
Precious lives and heart treasures, too
Positions and golden futures,
Have been "wasted" on You, Lord;
Your sweetness a fragrance so sure.
She took opportunity
To love You; Lord, with her best.
Like her, Lord, I too would pour
My love and all that I have.` },
    { id: "h5", clueLines: [
      [{ type: "emoji", value: "\u{274C}" }, { type: "emoji", value: "\u{1F3E0}" }, { type: "emoji", value: "\u{274C}" }, { type: "emoji", value: "\u{1F6CF}\u{FE0F}" }, { type: "image", src: "/questions/hymn/building-up.png", alt: "Building up" }],
    ], prompt: "Which hymn do these picture clues show?", answer: "Recall How David Swore", answerTitle: "Recall How David Swore", answerLyrics: `Recall how David swore,
"I'll not come into my house,
Nor go up to my bed,
Give slumber to mine eyelids,
Until I find a place for Thee,
A place, O Lord, for Thee."
Our mighty God desires a home
Where all His own may come.` },
    { id: "h6", clueLines: [
      [{ type: "emoji", value: "\u{1F964}" }, { type: "image", src: "/questions/hymn/river.png", alt: "River" }, { type: "emoji", value: "\u{1F451}" }],
    ], prompt: "Which hymn do these picture clues show?", answer: "Drink! A River Pure and Clear", answerTitle: "Drink! A River Pure and Clear", answerLyrics: `Drink! A river pure and clear that's flowing from the throne;
Eat! The tree of life with fruits abundant, richly grown;
Look! No need of lamp nor sun nor moon to keep it bright, for
Here there is no night!
Do come, oh, do come,
Says Spirit and the Bride:
Do come, oh, do come,
Let him that heareth, cry.
Do come, oh, do come,
Let him who thirsts and will
Take freely the water of life!` },
    { id: "h7", clueLines: [
      [{ type: "emoji", value: "\u{1F442}" }, { type: "emoji", value: "\u{1F50A}" }, { type: "emoji", value: "\u{1F446}" }, { type: "emoji", value: "\u{1F451}" }, { type: "emoji", value: "\u{1F389}" }],
    ], prompt: "Which hymn do these picture clues show?", answer: "Hark! Ten Thousand Heavenly Voices", answerTitle: "Hark! Ten Thousand Heavenly Voices", answerLyrics: `Hark! Ten thousand heavenly voices
Sound the note of praise above;
Jesus reigns and heaven rejoices,
Jesus reigns, the God of love.
See, He sits on yonder throne;
Jesus rules the world alone.
Hallelujah, Hallelujah,
Hallelujah, Amen.` },
    { id: "h8", clueLines: [
      [{ type: "emoji", value: "\u{1F60A}" }, { type: "emoji", value: "1\u{FE0F}\u{20E3}" }, { type: "image", src: "/questions/hymn/ointment.png", alt: "Ointment" }, { type: "emoji", value: "\u{1F4A7}" }, { type: "emoji", value: "\u{1F464}" }],
    ], prompt: "Which hymn do these picture clues show?", answer: "Behold How Good and How Pleasant It Is", answerTitle: "Behold How Good and How Pleasant It Is", answerLyrics: `Behold how good and how pleasant it is,
For brethren to dwell together in unity!
Behold how good and how pleasant it is,
For brethren to dwell together in unity!
It is like the precious ointment upon the head,
That ran down upon the beard,
Even Aaron's beard:
That went down to the skirts of his garments.` },
    { id: "h9", clueLines: [
      [{ type: "emoji", value: "\u{1F64F}" }, { type: "image", src: "/questions/hymn/private-room.png", alt: "Private room" }, { type: "image", src: "/questions/hymn/face-to-face.png", alt: "Face to face" }],
    ], prompt: "Which hymn do these picture clues show?", answer: "Pray to Fellowship with Jesus", answerTitle: "Pray to Fellowship with Jesus", answerLyrics: `Pray to fellowship with Jesus,
In the spirit seek His face;
Ask and listen in His presence,
Waiting in the secret place.
Pray to fellowship with Jesus,
In the spirit seek His face;
Ask and listen in His presence,
Waiting in the secret place.` },
    { id: "h10", clueLines: [
      [{ type: "image", src: "/questions/hymn/portion-water.png", alt: "Portion" }, { type: "emoji", value: "\u{2764}\u{FE0F}" }],
      [{ type: "emoji", value: "\u{274C}" }, { type: "emoji", value: "U" }, { type: "emoji", value: "\u{2B06}\u{FE0F}" }, { type: "emoji", value: "\u{1F30D}" }, { type: "emoji", value: "0" }],
    ], prompt: "Which hymn do these picture clues show?", answer: "My God, My Portion, and My Love", answerTitle: "My God, My Portion, and My Love", answerLyrics: `My God, my Portion, and my Love,
My everlasting All,
I've none but Thee in heaven above,
Or on this earthly ball,
Or on this earthly ball.` },
    { id: "h11", clueLines: [
      [{ type: "emoji", value: "\u{1F442}" }, { type: "emoji", value: "\u{1F50A}" }, { type: "emoji", value: "\u{1FAF4}" }, { type: "emoji", value: "\u{2668}\u{FE0F}" }, { type: "image", src: "/questions/hymn/rest.png", alt: "Rest" }],
    ], prompt: "Which hymn do these picture clues show?", answer: "I Heard the Voice of Jesus Say", answerTitle: "I Heard the Voice of Jesus Say", answerLyrics: `I heard the voice of Jesus say,
"Come unto Me, and rest;
Lay down, thou weary one, lay down
Thy head upon My breast."
I came to Jesus as I was,
Weary, and worn, and sad;
I found in Him a resting-place,
And He has made me glad.` },
  ],
};

const gameMeta: Record<GameKey, { title: string; label: string; round: string; color: string; rules: string[] }> = {
  zoom: {
    title: "Zoom & Guess",
    label: "Guess the object from a zoomed-in picture.",
    round: "Round 1",
    color: "coral",
    rules: [
      "The host controls the buttons while the team guesses out loud.",
      "Use Correct when the team gets the item right.",
      "Use Skip when the team wants to try again later.",
      "Use Wrong only when the team wants to reveal the answer.",
      "If the host gives an oral hint, tap the Hints counter. Zoom has 5 hints total.",
      "The team can guess as many items as possible in 5 minutes.",
    ],
  },
  bible: {
    title: "Bible Story",
    label: "Guess the Bible story from pictures or emojis.",
    round: "Round 2",
    color: "blue",
    rules: [
      "The host controls the buttons while the team guesses out loud.",
      "Use Correct when the team names the Bible story.",
      "Use Skip when the team wants to try again later.",
      "Use Wrong only when the team wants to reveal the answer.",
      "If the host gives an oral hint, tap the Hints counter.",
      "Bible Story and Hymn share one 5-minute timer.",
      "Bible Story and Hymn also share 5 hints total.",
    ],
  },
  hymn: {
    title: "Hymn Guess",
    label: "Guess the hymn from picture or emoji clues.",
    round: "Round 2",
    color: "gold",
    rules: [
      "The host controls the buttons while the team guesses out loud.",
      "Use Correct when the team names the hymn.",
      "Use Skip when the team wants to try again later.",
      "Use Wrong only when the team wants to reveal the answer.",
      "If the host gives an oral hint, tap the Hints counter.",
      "Bible Story and Hymn share one 5-minute timer.",
      "Bible Story and Hymn also share 5 hints total.",
    ],
  },
};

const sampleQuestions: Record<GameKey, Question> = {
  zoom: {
    id: "sample-zoom",
    visual: "🍎",
    prompt: "What is this sample clue?",
    answer: "Apple",
  },
  bible: {
    id: "sample-bible",
    clueLines: [[
      { type: "emoji", value: "🌧️" },
      { type: "emoji", value: "🚢" },
      { type: "emoji", value: "🕊️" },
      { type: "emoji", value: "🌈" },
    ]],
    prompt: "What is this sample clue?",
    answer: "Noah's Ark",
  },
  hymn: {
    id: "sample-hymn",
    clueLines: [[
      { type: "emoji", value: "✨" },
      { type: "emoji", value: "🙏" },
      { type: "emoji", value: "🎶" },
    ]],
    prompt: "What is this sample clue?",
    answer: "Amazing Grace",
  },
};

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [team, setTeam] = useState("");
  const [scores, setScores] = useState<Scores>(emptyScores);
  const [hints, setHints] = useState<HintCounts>(startingHints);
  const [game, setGame] = useState<GameKey>("zoom");
  const [index, setIndex] = useState(0);
  const [queue, setQueue] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [locked, setLocked] = useState(false);
  const [seconds, setSeconds] = useState(roundSeconds);
  const [finished, setFinished] = useState(false);
  const [round2Active, setRound2Active] = useState(false);
  const [round2Progress, setRound2Progress] = useState<Round2Progress>(emptyRound2Progress);
  const [records, setRecords] = useState<TeamRecord[]>([]);
  const [recordsLoaded, setRecordsLoaded] = useState(false);
  const [savedRecordId, setSavedRecordId] = useState<string | null>(null);
  const scoringLockRef = useRef(false);

  const current = questions[game].find((q) => q.id === queue[0]);
  const sample = sampleQuestions[game];
  const total = scores.zoom + scores.bible + scores.hymn;
  const questionTotal = questions[game].length;
  const progress = Math.max(0, Math.min(100, (index / Math.max(questionTotal, 1)) * 100));
  const timeLabel = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const hintKey: keyof HintCounts = game === "zoom" ? "zoom" : "round2";
  const hintsLeft = hints[hintKey];
  const imageSrc = (src?: string) => src ? `${src}?${imageVersion}` : undefined;
  const renderClue = (question: Question) => {
    if (question.clueLines) {
      return (
        <div className="clue-board">
          {question.clueLines.map((line, lineIndex) => (
            <div className="clue-line" key={`${question.id}-${lineIndex}`}>
              {line.map((token, tokenIndex) => token.type === "image" ? (
                <img className="clue-image" key={`${question.id}-${lineIndex}-${tokenIndex}`} src={imageSrc(token.src)} alt={token.alt} />
              ) : (
                <span className="clue-emoji" key={`${question.id}-${lineIndex}-${tokenIndex}`}>{token.value}</span>
              ))}
            </div>
          ))}
        </div>
      );
    }
    return <span>{question.visual}</span>;
  };
  const isLastQuestion = queue.length === 1;

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    const loadRecords = window.setTimeout(() => {
      if (saved) setRecords(JSON.parse(saved) as TeamRecord[]);
      setRecordsLoaded(true);
    }, 0);
    return () => window.clearTimeout(loadRecords);
  }, []);

  useEffect(() => {
    if (!recordsLoaded) return;
    window.localStorage.setItem(storageKey, JSON.stringify(records));
  }, [records, recordsLoaded]);

  useEffect(() => {
    if (screen !== "play" || finished) return;
    const timer = window.setInterval(() => setSeconds((s) => {
      if (s <= 1) {
        setFinished(true);
        return 0;
      }
      return s - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [screen, finished]);

  const final = useMemo(() => ({ ...scores, total }), [scores, total]);
  const teamName = team.trim();
  const teamBadge = <div className="team-badge"><span>Team</span><strong>{teamName || "No team selected"}</strong></div>;

  const chooseGame = (nextGame: GameKey) => {
    setGame(nextGame);
    setScreen("briefing");
  };

  const startGame = () => {
    scoringLockRef.current = false;
    setIndex(0);
    setQueue(questions[game].map((q) => q.id));
    setRevealed(false);
    setLocked(false);
    if (game === "zoom" || !round2Active) setSeconds(roundSeconds);
    if (game !== "zoom") {
      setRound2Active(true);
      setRound2Progress((state) => ({
        ...state,
        [game]: {
          queue: questions[game].map((q) => q.id),
          completed: 0,
          revealed: false,
          locked: false,
        },
      }));
    }
    setFinished(false);
    setScreen("play");
  };

  const chooseRound2Game = (nextGame: Round2Key) => {
    if (!round2Active) {
      chooseGame(nextGame);
      return;
    }
    if (game === "bible" || game === "hymn") {
      setRound2Progress((state) => ({
        ...state,
        [game]: { queue, completed: index, revealed, locked },
      }));
    }
    const saved = round2Progress[nextGame];
    const isUnstarted = saved.queue.length === 0 && saved.completed === 0;
    setGame(nextGame);
    setQueue(isUnstarted ? questions[nextGame].map((q) => q.id) : saved.queue);
    setIndex(saved.completed);
    setRevealed(saved.revealed);
    setLocked(saved.locked);
    scoringLockRef.current = saved.locked;
    setFinished(seconds === 0);
    setScreen("play");
  };

  const goNext = () => {
    scoringLockRef.current = false;
    const nextQueue = queue.slice(1);
    const nextCompleted = index + 1;
    setQueue(nextQueue);
    setIndex(nextCompleted);
    if (game === "bible" || game === "hymn") {
      setRound2Progress((state) => ({
        ...state,
        [game]: {
          queue: nextQueue,
          completed: nextCompleted,
          revealed: false,
          locked: false,
        },
      }));
    }
    setRevealed(false);
    setLocked(false);

    if (nextQueue.length > 0) return;
    if (game === "zoom") {
      finishCurrentRound();
      return;
    }

    const otherGame: Round2Key = game === "bible" ? "hymn" : "bible";
    const other = round2Progress[otherGame];
    const otherIsUnstarted = other.queue.length === 0 && other.completed === 0;
    const otherQueue = otherIsUnstarted ? questions[otherGame].map((q) => q.id) : other.queue;
    if (otherQueue.length === 0) {
      setFinished(true);
      return;
    }
    setGame(otherGame);
    setQueue(otherQueue);
    setIndex(other.completed);
    setRevealed(other.revealed);
    setLocked(other.locked);
  };

  const finishCurrentRound = () => {
    scoringLockRef.current = false;
    setFinished(true);
    setRevealed(false);
    setLocked(false);
  };

  const chooseAction = (result: "correct" | "wrong" | "skip") => {
    if (locked || scoringLockRef.current) return;
    if (result === "skip") {
      if (queue.length <= 1) return;
      const nextQueue = [...queue.slice(1), queue[0]];
      setQueue(nextQueue);
      if (game === "bible" || game === "hymn") {
        setRound2Progress((state) => ({
          ...state,
          [game]: {
            queue: nextQueue,
            completed: index,
            revealed: false,
            locked: false,
          },
        }));
      }
      setRevealed(false);
      setLocked(false);
      return;
    }
    scoringLockRef.current = true;
    if (result === "correct") setScores((s) => ({ ...s, [game]: s[game] + 1 }));
    setRevealed(true);
    setLocked(true);
    if (game === "bible" || game === "hymn") {
      setRound2Progress((state) => ({
        ...state,
        [game]: { queue, completed: index, revealed: true, locked: true },
      }));
    }
  };

  const useHint = () => {
    setHints((currentHints) => {
      if (currentHints[hintKey] <= 0) return currentHints;
      return { ...currentHints, [hintKey]: currentHints[hintKey] - 1 };
    });
  };

  const saveFinalScore = () => {
    if (savedRecordId || !teamName) return;
    const record: TeamRecord = {
      id: `${Date.now()}`,
      team: teamName,
      scores,
      total,
      completedAt: new Date().toLocaleString(),
    };
    setSavedRecordId(record.id);
    setRecords((items) => [record, ...items]);
  };

  const resetTeam = () => {
    scoringLockRef.current = false;
    setScores(emptyScores);
    setHints(startingHints);
    setSavedRecordId(null);
    setTeam("");
    setRound2Active(false);
    setRound2Progress(emptyRound2Progress);
    setScreen("home");
  };

  const clearScoreboard = () => {
    setRecords([]);
    setSavedRecordId(null);
  };

  if (screen === "home") {
    return (
      <main className="shell home-simple">
        <section className="home-panel">
          <p className="eyebrow">Welcome</p>
          <h1>Game Station</h1>
          <form onSubmit={(e) => { e.preventDefault(); if (teamName) setScreen("menu"); }}>
            <label htmlFor="team">Team name</label>
            <input id="team" value={team} onChange={(e) => setTeam(e.target.value)} placeholder="Enter team name" autoFocus />
            <button className="primary" type="submit">Enter</button>
          </form>
          <button className="text-button" type="button" onClick={() => setScreen("scoreboard")}>View scoreboard</button>
        </section>
      </main>
    );
  }

  if (screen === "menu") {
    return (
      <main className="shell centered">
        <div className="topline"><span className="brand-mark">GS</span>{teamBadge}</div>
        <p className="eyebrow">Choose a game</p>
        <h1>Game Station</h1>
        <div className="game-grid">
          <button className="game-tile coral" onClick={() => chooseGame("zoom")}><b>Zoom & Guess</b><small>Guess the object from a zoomed-in picture.</small></button>
          <button className="game-tile blue" onClick={() => setScreen("category")}><b>Picture & Emoji</b><small>Guess a Bible story or hymn from clue images.</small></button>
        </div>
        <div className="menu-actions">
          <button className="secondary" onClick={() => setScreen("scoreboard")}>Scoreboard</button>
          <button className="secondary" onClick={resetTeam}>Change team</button>
        </div>
      </main>
    );
  }

  if (screen === "category") {
    return (
      <main className="shell centered">
        <div className="topline compact"><button className="back" onClick={() => setScreen("menu")}>Back</button>{teamBadge}</div>
        <p className="eyebrow">Picture & Emoji</p>
        <h1>Pick a category</h1>
        <div className="category-row">
          <button className="category bible" onClick={() => chooseRound2Game("bible")}><b>Bible Story</b><small>Guess the story from clues.</small></button>
          <button className="category hymn" onClick={() => chooseRound2Game("hymn")}><b>Hymn</b><small>Guess the hymn title.</small></button>
        </div>
        <p className="tiny-note">Bible Story and Hymn share one 5-minute timer.</p>
      </main>
    );
  }

  if (screen === "briefing") {
    return (
      <main className={`shell briefing ${gameMeta[game].color}`}>
        <div className="topline compact"><button className="back" onClick={() => setScreen(game === "zoom" ? "menu" : "category")}>Back</button>{teamBadge}</div>
        <p className="eyebrow">{gameMeta[game].round}</p>
        <h1>{gameMeta[game].title}</h1>
        <p className="lead">{gameMeta[game].label}</p>
        <section className="briefing-grid">
          <div className="rules">
            <h2>How to play</h2>
            {gameMeta[game].rules.map((rule) => <p key={rule}>{rule}</p>)}
          </div>
          <div className="sample-card">
            {sample.image ? <img src={imageSrc(sample.image)} alt="Sample clue" /> : renderClue(sample)}
            <small>Practice sample</small>
            <strong>{sample.answer}</strong>
          </div>
        </section>
        <button className="primary" onClick={startGame}>Start 5-minute round</button>
      </main>
    );
  }

  if (screen === "result") {
    return (
      <main className="shell result centered">
        <p className="eyebrow">Final score</p>
        <h1>{teamName}</h1>
        <div className="score-total"><span>Total</span><strong>{final.total}</strong><small>points</small></div>
        <div className="score-breakdown">
          <span>Zoom & Guess <b>{final.zoom}</b></span>
          <span>Bible Story <b>{final.bible}</b></span>
          <span>Hymn <b>{final.hymn}</b></span>
        </div>
        <div className="menu-actions result-actions">
          <button className="primary" onClick={saveFinalScore}>{savedRecordId ? "Score saved" : "Save score"}</button>
          <button className="secondary" onClick={() => setScreen("scoreboard")}>View scoreboard</button>
          <button className="secondary" onClick={resetTeam}>Play another team</button>
        </div>
      </main>
    );
  }

  if (screen === "scoreboard") {
    return (
      <main className="shell centered scoreboard">
        <button className="back" onClick={() => setScreen(teamName ? "menu" : "home")}>Back</button>
        <p className="eyebrow">Saved results</p>
        <h1>Scoreboard</h1>
        {records.length > 0 && <button className="secondary clear-board" onClick={clearScoreboard}>Clear scoreboard</button>}
        {records.length === 0 ? <p className="empty">No saved team scores yet.</p> : (
          <div className="score-table">
            {records.map((record) => (
              <article className="score-row" key={record.id}>
                <div><b>{record.team}</b><small>{record.completedAt}</small></div>
                <span>Zoom <b>{record.scores.zoom}</b></span>
                <span>Bible <b>{record.scores.bible}</b></span>
                <span>Hymn <b>{record.scores.hymn}</b></span>
                <strong>{record.total}</strong>
              </article>
            ))}
          </div>
        )}
      </main>
    );
  }

  return (
    <main className={`shell play ${game} ${gameMeta[game].color}`}>
      <header className="play-header">
        <div className="play-team"><span className="brand-mark">GS</span>{teamBadge}</div>
        <div className={`timer ${seconds < 30 ? "urgent" : ""}`}><span>Time left</span><strong>{timeLabel}</strong></div>
        <button className="hint-counter" onClick={useHint} disabled={hintsLeft <= 0} type="button"><span>Hints</span><strong>{hintsLeft}</strong></button>
        <div className="live-score"><span>Score</span><strong>{total}</strong></div>
      </header>
      <div className="play-title">
        <div><p className="eyebrow">{gameMeta[game].round} · {gameMeta[game].title}</p><h2>{gameMeta[game].label}</h2></div>
        <span className="question-count">{index} answered · {queue.length} remaining</span>
      </div>
      <div className="progress"><i style={{ width: `${progress}%` }} /></div>
      <section className="question">
        <div className={`visual ${revealed ? "revealed" : ""} ${!revealed && current?.image ? "clue-framed" : ""}`} aria-label="question visual">
          {!current ? <strong>Category complete</strong> : revealed && current.answerImage ? <img key={`${current.id}-answer`} src={imageSrc(current.answerImage)} alt={current.answer} /> : current.image ? <img key={`${current.id}-clue`} className="zoom-clue" style={{ transform: `scale(${current.clueScale ?? 1})`, transformOrigin: current.cluePosition ?? "center" }} src={imageSrc(current.image)} alt="Zoomed-in clue" /> : renderClue(current)}
          {current && revealed && <div className={`answer-label ${game === "bible" ? "scripture" : ""}`}><small>Answer</small><strong>{current.answerTitle ?? current.answer}</strong>{current.answerLyrics && <p>{current.answerLyrics}</p>}</div>}
        </div>
        <p className="prompt">{current?.prompt ?? "All questions in this category are complete."}</p>
        <p className="thinking">{revealed ? "Answer revealed." : "Let the team guess before you score it."}</p>
      </section>
      {finished ? (
        <div className="timeup">
          <strong>{seconds === 0 ? "Time's up!" : "Round complete!"}</strong>
          <span>This round is complete.</span>
          <button className="primary" onClick={() => {
            if (game === "zoom") {
              setScreen("category");
            } else {
              saveFinalScore();
              setScreen("result");
            }
          }}>Continue</button>
        </div>
      ) : (
        <div className="actions">
          {(game === "bible" || game === "hymn") && <button className="switch" onClick={() => chooseRound2Game(game === "bible" ? "hymn" : "bible")}>Switch to {game === "bible" ? "Hymn" : "Bible Story"}</button>}
          {current && !locked && <button className="wrong" onClick={() => chooseAction("wrong")}>Wrong</button>}
          {current && !locked && <button className="skip" disabled={queue.length <= 1} onClick={() => chooseAction("skip")}>Skip</button>}
          {current && !locked && <button className="correct" onClick={() => chooseAction("correct")}>Correct</button>}
          {locked && <button className="next" onClick={goNext}>{game === "zoom" && isLastQuestion ? "Finish Zoom Round" : "Next question"}</button>}
        </div>
      )}
      <button className="quit" onClick={() => setScreen("menu")}>Exit round</button>
    </main>
  );
}
