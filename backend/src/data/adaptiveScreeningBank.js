/**
 * Adaptive Screening Bank — 100 questions (English 50 + Mathematics 50)
 * Phase 1 (v2): intentional, skill-appropriate question types + image/audio metadata.
 *
 * NEW assessment, SEPARATE from the existing LD screening (dyslexia/
 * dysgraphia/dyscalculia). Age-neutral, skill-based, adaptive-ready.
 *
 * English (50): Speaking 7, Writing 7, Reading 7, Listening 7,
 *   Production 6, Literacy 6, Comprehension 5, Conversation 5.
 * Math (50): Number Sense 5, Basic Arithmetic 6, Addition & Subtraction 5,
 *   Multiplication & Division 5, Fractions & Decimals 5, Mathematical
 *   Reasoning 5, Word Problems 5, Algebraic Thinking 4, Geometry &
 *   Measurement 5, Data Interpretation 5.
 *
 * Difficulty: Beginner | Intermediate | Advanced (each skill mixes levels).
 *
 * Question model:
 *   id, subject, skill, subSkill, difficulty, questionType, question,
 *   options[], correctAnswer, expectedAnswer, image, audio, points,
 *   scoringMethod, explanation
 *
 * image metadata:  { required, type, asset, altText }   (null if none)
 * audio metadata:  { required, asset }                  (null if none)
 *   NOTE: image/audio "asset" are LOCAL paths under /assets/questions/...
 *   Assets may be added later; the bank stays functional without them
 *   (image.required / audio.required flags let the UI degrade gracefully).
 *
 * questionType vocabulary (skill-appropriate):
 *   English: read-aloud, short-spoken-answer, speaking-response,
 *     image-description-speaking, short-answer, sentence-construction,
 *     fill-in-the-blank, text-construction, multiple-choice,
 *     passage-comprehension, image-multiple-choice, image-identification,
 *     image-comprehension, image-based-conversation, audio-multiple-choice,
 *     audio-short-answer, audio-identification, follow-spoken-instruction,
 *     short-response, conversation-response, situational-response,
 *     follow-up-response
 *   Math: numeric-answer, fill-in-the-blank, multiple-choice, ordering,
 *     matching, image-multiple-choice, image-based-short-answer,
 *     data-chart, math-problem-solving, math-reasoning
 *
 * scoringMethod vocabulary:
 *   exact-match        — MCQ / exact option compare
 *   numeric-match      — numeric equality (strips units/spaces)
 *   normalized-match   — trim+lowercase+collapse-space compare
 *   ordered-match      — sequence equality (ordering questions)
 *   matching-pairs     — pair map equality (matching questions)
 *   stt-match          — STT transcript vs expectedAnswer.targetText (speaking)
 *   semantic-response  — response contains expected concepts (STT or typed)
 *   ai-rubric          — Gemma rubric scores an open response 0..points
 *
 * Adding questions later: append objects with the same shape. The Phase-2
 * engine reads skills/distribution dynamically — no engine change needed.
 */

const ADAPTIVE_SCREENING_BANK = [
  {
    "id": "ENG-SPK-001",
    "subject": "English",
    "skill": "Speaking",
    "subSkill": "Read Aloud",
    "difficulty": "Beginner",
    "questionType": "read-aloud",
    "question": "Read this sentence aloud: 'The sun is bright today.'",
    "options": [],
    "correctAnswer": null,
    "expectedAnswer": {
      "targetText": "The sun is bright today.",
      "evaluate": [
        "pronunciation",
        "fluency"
      ]
    },
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "stt-match",
    "explanation": "Compare STT transcript to the target sentence. Accent is not judged."
  },
  {
    "id": "ENG-SPK-002",
    "subject": "English",
    "skill": "Speaking",
    "subSkill": "Repeat Sentence",
    "difficulty": "Beginner",
    "questionType": "read-aloud",
    "question": "Listen and repeat.",
    "audioScript": "I have a red ball.",
    "options": [],
    "correctAnswer": null,
    "expectedAnswer": {
      "targetText": "I have a red ball.",
      "evaluate": [
        "fluency",
        "accuracy"
      ]
    },
    "image": null,
    "audio": {
      "required": true,
      "asset": "/assets/questions/english/audio/i-have-a-red-ball.mp3"
    },
    "points": 1,
    "scoringMethod": "stt-match",
    "explanation": "Repetition accuracy from STT transcript."
  },
  {
    "id": "ENG-SPK-003",
    "subject": "English",
    "skill": "Speaking",
    "subSkill": "Basic Response",
    "difficulty": "Beginner",
    "questionType": "short-spoken-answer",
    "question": "Say aloud: What is your favorite food?",
    "options": [],
    "correctAnswer": null,
    "expectedAnswer": {
      "minimumConcepts": [
        "names a food",
        "forms a short sentence"
      ],
      "evaluate": [
        "response accuracy",
        "vocabulary"
      ]
    },
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "semantic-response",
    "explanation": "Any clear spoken response naming a food is acceptable."
  },
  {
    "id": "ENG-SPK-IMG-001",
    "subject": "English",
    "skill": "Speaking",
    "subSkill": "Picture Description",
    "difficulty": "Beginner",
    "questionType": "image-description-speaking",
    "question": "Look at the picture and describe what you see in one sentence.",
    "options": [],
    "correctAnswer": null,
    "expectedAnswer": {
      "minimumConcepts": [
        "identifies main object",
        "describes a visible action or object"
      ],
      "evaluate": [
        "vocabulary",
        "sentence formation"
      ]
    },
    "image": {
      "required": true,
      "type": "illustration",
      "asset": "/assets/questions/english/park-scene.png",
      "altText": "A simple park scene with people and trees"
    },
    "audio": null,
    "points": 1,
    "scoringMethod": "semantic-response",
    "explanation": "Learner should mention main visible elements (people, trees, park)."
  },
  {
    "id": "ENG-SPK-004",
    "subject": "English",
    "skill": "Speaking",
    "subSkill": "Answer Question",
    "difficulty": "Intermediate",
    "questionType": "short-spoken-answer",
    "question": "Answer aloud: What did you do this morning?",
    "options": [],
    "correctAnswer": null,
    "expectedAnswer": {
      "minimumConcepts": [
        "uses past tense",
        "describes an activity"
      ],
      "evaluate": [
        "fluency",
        "sentence formation"
      ]
    },
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "semantic-response",
    "explanation": "Coherent past-tense spoken response."
  },
  {
    "id": "ENG-SPK-005",
    "subject": "English",
    "skill": "Speaking",
    "subSkill": "Explain",
    "difficulty": "Advanced",
    "questionType": "speaking-response",
    "question": "Explain in your own words why exercise is good for you.",
    "options": [],
    "correctAnswer": null,
    "expectedAnswer": {
      "minimumConcepts": [
        "states at least two reasons",
        "stays on topic"
      ],
      "evaluate": [
        "fluency",
        "vocabulary",
        "reasoning"
      ]
    },
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "ai-rubric",
    "explanation": "Gemma rubric scores relevance and sentence formation, not accent."
  },
  {
    "id": "ENG-SPK-006",
    "subject": "English",
    "skill": "Speaking",
    "subSkill": "Give Opinion",
    "difficulty": "Advanced",
    "questionType": "speaking-response",
    "question": "Give your opinion aloud: Is it better to read a book or watch a movie? Say why.",
    "options": [],
    "correctAnswer": null,
    "expectedAnswer": {
      "minimumConcepts": [
        "states an opinion",
        "gives a supporting reason"
      ],
      "evaluate": [
        "fluency",
        "reasoning"
      ]
    },
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "ai-rubric",
    "explanation": "Checks that an opinion + reason are present."
  },
  {
    "id": "ENG-WRI-001",
    "subject": "English",
    "skill": "Writing",
    "subSkill": "Spelling",
    "difficulty": "Beginner",
    "questionType": "fill-in-the-blank",
    "question": "Fill in the missing letter to spell a small pet that says meow: c _ t",
    "options": [],
    "correctAnswer": "a",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "normalized-match",
    "explanation": "'cat' — the missing letter is 'a'."
  },
  {
    "id": "ENG-WRI-002",
    "subject": "English",
    "skill": "Writing",
    "subSkill": "Sentence Construction",
    "difficulty": "Beginner",
    "questionType": "sentence-construction",
    "question": "Put these words in order to make a correct sentence: [ dog | the | runs ]",
    "options": [],
    "correctAnswer": "The dog runs.",
    "expectedAnswer": {
      "targetText": "the dog runs"
    },
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "normalized-match",
    "explanation": "Correct order: 'The dog runs.'"
  },
  {
    "id": "ENG-WRI-003",
    "subject": "English",
    "skill": "Writing",
    "subSkill": "Free Sentence",
    "difficulty": "Beginner",
    "questionType": "short-answer",
    "question": "Write one complete sentence about your favorite color.",
    "options": [],
    "correctAnswer": null,
    "expectedAnswer": {
      "minimumConcepts": [
        "complete sentence",
        "names a color"
      ],
      "evaluate": [
        "grammar",
        "clarity"
      ]
    },
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "ai-rubric",
    "explanation": "Checks for a complete sentence containing a color word."
  },
  {
    "id": "ENG-WRI-004",
    "subject": "English",
    "skill": "Writing",
    "subSkill": "Correction",
    "difficulty": "Intermediate",
    "questionType": "short-answer",
    "question": "Correct this sentence: 'she go to school every day.'",
    "options": [],
    "correctAnswer": "She goes to school every day.",
    "expectedAnswer": {
      "targetText": "She goes to school every day."
    },
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "normalized-match",
    "explanation": "Fix capitalization and verb agreement."
  },
  {
    "id": "ENG-WRI-005",
    "subject": "English",
    "skill": "Writing",
    "subSkill": "Fill Blank",
    "difficulty": "Intermediate",
    "questionType": "fill-in-the-blank",
    "question": "Fill in the blank with the correct word: 'She ___ to music every evening.' (listen)",
    "options": [],
    "correctAnswer": "listens",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "normalized-match",
    "explanation": "Third-person singular: 'listens'."
  },
  {
    "id": "ENG-WRI-006",
    "subject": "English",
    "skill": "Writing",
    "subSkill": "Construct From Words",
    "difficulty": "Intermediate",
    "questionType": "sentence-construction",
    "question": "Make a correct sentence using ALL these words: [ garden | the | in | plays | she ]",
    "options": [],
    "correctAnswer": "She plays in the garden.",
    "expectedAnswer": {
      "targetText": "she plays in the garden"
    },
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "normalized-match",
    "explanation": "'She plays in the garden.'"
  },
  {
    "id": "ENG-WRI-007",
    "subject": "English",
    "skill": "Writing",
    "subSkill": "Paragraph",
    "difficulty": "Advanced",
    "questionType": "text-construction",
    "question": "Write 2–3 sentences about a place you would like to visit and why.",
    "options": [],
    "correctAnswer": null,
    "expectedAnswer": {
      "minimumConcepts": [
        "names a place",
        "gives a reason",
        "2+ sentences"
      ],
      "evaluate": [
        "grammar",
        "coherence",
        "vocabulary"
      ]
    },
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "ai-rubric",
    "explanation": "Rubric: coherence, grammar, and a stated reason."
  },
  {
    "id": "ENG-REA-IMG-001",
    "subject": "English",
    "skill": "Reading",
    "subSkill": "Word-Picture Match",
    "difficulty": "Beginner",
    "questionType": "image-multiple-choice",
    "question": "Which word describes the picture?",
    "options": [
      "Apple",
      "Car",
      "House",
      "Book"
    ],
    "correctAnswer": "Apple",
    "expectedAnswer": null,
    "image": {
      "required": true,
      "type": "illustration",
      "asset": "/assets/questions/english/apple.png",
      "altText": "A red apple"
    },
    "audio": null,
    "points": 1,
    "scoringMethod": "exact-match",
    "explanation": "The picture shows an apple."
  },
  {
    "id": "ENG-REA-001",
    "subject": "English",
    "skill": "Reading",
    "subSkill": "Word Meaning",
    "difficulty": "Beginner",
    "questionType": "multiple-choice",
    "question": "What does 'happy' mean?",
    "options": [
      "feeling sad",
      "feeling glad",
      "feeling tired"
    ],
    "correctAnswer": "feeling glad",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "exact-match",
    "explanation": "'happy' = feeling glad."
  },
  {
    "id": "ENG-REA-002",
    "subject": "English",
    "skill": "Reading",
    "subSkill": "Sentence Reading",
    "difficulty": "Beginner",
    "questionType": "multiple-choice",
    "question": "Read: 'The cat sat on the mat.' Where did the cat sit?",
    "options": [
      "on the mat",
      "on the bed",
      "on the chair"
    ],
    "correctAnswer": "on the mat",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "exact-match",
    "explanation": "Directly stated."
  },
  {
    "id": "ENG-REA-003",
    "subject": "English",
    "skill": "Reading",
    "subSkill": "Vocabulary",
    "difficulty": "Intermediate",
    "questionType": "multiple-choice",
    "question": "Choose the word closest in meaning to 'big'.",
    "options": [
      "tiny",
      "large",
      "narrow"
    ],
    "correctAnswer": "large",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "exact-match",
    "explanation": "'big' ≈ 'large'."
  },
  {
    "id": "ENG-REA-004",
    "subject": "English",
    "skill": "Reading",
    "subSkill": "Passage Detail",
    "difficulty": "Intermediate",
    "questionType": "passage-comprehension",
    "question": "Passage: 'Maya went to the shop. She bought milk and bread. Then she walked home.' What did Maya buy?",
    "options": [
      "milk and eggs",
      "milk and bread",
      "bread and rice"
    ],
    "correctAnswer": "milk and bread",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "exact-match",
    "explanation": "Stated detail from the passage."
  },
  {
    "id": "ENG-REA-005",
    "subject": "English",
    "skill": "Reading",
    "subSkill": "Short Answer",
    "difficulty": "Intermediate",
    "questionType": "short-answer",
    "question": "Read: 'Ravi has two brothers and one sister.' How many brothers does Ravi have? (type the number in words or digits)",
    "options": [],
    "correctAnswer": "two",
    "expectedAnswer": {
      "accept": [
        "two",
        "2"
      ]
    },
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "normalized-match",
    "explanation": "Two brothers."
  },
  {
    "id": "ENG-REA-006",
    "subject": "English",
    "skill": "Reading",
    "subSkill": "Main Idea",
    "difficulty": "Advanced",
    "questionType": "passage-comprehension",
    "question": "Passage: 'Plants need sunlight, water, and air to grow well. Without them, plants become weak.' What is the main idea?",
    "options": [
      "Plants only need water",
      "Plants need several things to grow",
      "Plants do not need air"
    ],
    "correctAnswer": "Plants need several things to grow",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "exact-match",
    "explanation": "Overall point."
  },
  {
    "id": "ENG-LIS-001",
    "subject": "English",
    "skill": "Listening",
    "subSkill": "Word Recognition",
    "difficulty": "Beginner",
    "questionType": "audio-multiple-choice",
    "question": "Listen and select the word you hear.",
    "options": [
      "Cat",
      "Car",
      "Cap",
      "Cake"
    ],
    "correctAnswer": "Cat",
    "expectedAnswer": null,
    "image": null,
    "audio": {
      "required": true,
      "asset": "/assets/questions/english/audio/cat.mp3"
    },
    "points": 1,
    "scoringMethod": "exact-match",
    "explanation": "The audio says 'cat'."
  },
  {
    "id": "ENG-LIS-002",
    "subject": "English",
    "skill": "Listening",
    "subSkill": "Sentence Identification",
    "difficulty": "Beginner",
    "questionType": "audio-identification",
    "question": "Listen and choose the sentence you heard.",
    "options": [
      "I like ice cream.",
      "I ride a bike.",
      "I see the moon."
    ],
    "correctAnswer": "I like ice cream.",
    "expectedAnswer": null,
    "image": null,
    "audio": {
      "required": true,
      "asset": "/assets/questions/english/audio/i-like-ice-cream.mp3"
    },
    "points": 1,
    "scoringMethod": "exact-match",
    "explanation": "Matches the spoken sentence."
  },
  {
    "id": "ENG-LIS-003",
    "subject": "English",
    "skill": "Listening",
    "subSkill": "Follow Instruction",
    "difficulty": "Beginner",
    "questionType": "follow-spoken-instruction",
    "question": "Listen to the instruction, then choose the correct word.",
    "options": [
      "blue",
      "run",
      "chair"
    ],
    "correctAnswer": "blue",
    "expectedAnswer": null,
    "image": null,
    "audio": {
      "required": true,
      "asset": "/assets/questions/english/audio/tap-a-color.mp3"
    },
    "points": 1,
    "scoringMethod": "exact-match",
    "explanation": "Instruction asks for a color → 'blue'."
  },
  {
    "id": "ENG-LIS-004",
    "subject": "English",
    "skill": "Listening",
    "subSkill": "Detail",
    "difficulty": "Intermediate",
    "questionType": "audio-multiple-choice",
    "question": "Listen and answer: When does the bus leave?",
    "audioScript": "The bus leaves at three o'clock.",
    "options": [
      "two o'clock",
      "three o'clock",
      "four o'clock"
    ],
    "correctAnswer": "three o'clock",
    "expectedAnswer": null,
    "image": null,
    "audio": {
      "required": true,
      "asset": "/assets/questions/english/audio/bus-three-oclock.mp3"
    },
    "points": 1,
    "scoringMethod": "exact-match",
    "explanation": "Detail from the audio."
  },
  {
    "id": "ENG-LIS-005",
    "subject": "English",
    "skill": "Listening",
    "subSkill": "Missing Info",
    "difficulty": "Intermediate",
    "questionType": "audio-short-answer",
    "question": "Listen and type the missing word: 'I drink ___ every morning.'",
    "audioScript": "I drink milk every morning.",
    "options": [],
    "correctAnswer": "milk",
    "expectedAnswer": null,
    "image": null,
    "audio": {
      "required": true,
      "asset": "/assets/questions/english/audio/i-drink-milk.mp3"
    },
    "points": 1,
    "scoringMethod": "normalized-match",
    "explanation": "The spoken missing word is 'milk'."
  },
  {
    "id": "ENG-LIS-006",
    "subject": "English",
    "skill": "Listening",
    "subSkill": "Comprehension",
    "difficulty": "Advanced",
    "questionType": "audio-multiple-choice",
    "question": "Listen and answer: Why was Ravi late?",
    "audioScript": "Ravi was late because his alarm did not ring.",
    "options": [
      "He woke up early",
      "His alarm did not ring",
      "He missed the bus"
    ],
    "correctAnswer": "His alarm did not ring",
    "expectedAnswer": null,
    "image": null,
    "audio": {
      "required": true,
      "asset": "/assets/questions/english/audio/ravi-late-alarm.mp3"
    },
    "points": 1,
    "scoringMethod": "exact-match",
    "explanation": "Cause stated in the audio."
  },
  {
    "id": "ENG-LIS-007",
    "subject": "English",
    "skill": "Listening",
    "subSkill": "Inference",
    "difficulty": "Advanced",
    "questionType": "audio-multiple-choice",
    "question": "Listen and answer: What is the weather likely to be?",
    "audioScript": "She put on a coat and gloves before going out.",
    "options": [
      "Cold",
      "Hot",
      "Rainy"
    ],
    "correctAnswer": "Cold",
    "expectedAnswer": null,
    "image": null,
    "audio": {
      "required": true,
      "asset": "/assets/questions/english/audio/coat-and-gloves.mp3"
    },
    "points": 1,
    "scoringMethod": "exact-match",
    "explanation": "Coat + gloves imply cold."
  },
  {
    "id": "ENG-PRO-001",
    "subject": "English",
    "skill": "Production",
    "subSkill": "Sentence Building",
    "difficulty": "Beginner",
    "questionType": "sentence-construction",
    "question": "Make a correct sentence using these words: [ I | like | apples ]",
    "options": [],
    "correctAnswer": "I like apples.",
    "expectedAnswer": {
      "targetText": "i like apples"
    },
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "normalized-match",
    "explanation": "'I like apples.'"
  },
  {
    "id": "ENG-PRO-IMG-001",
    "subject": "English",
    "skill": "Production",
    "subSkill": "Picture Description",
    "difficulty": "Beginner",
    "questionType": "image-description-speaking",
    "question": "Look at the picture and say one sentence about what the person is doing.",
    "options": [],
    "correctAnswer": null,
    "expectedAnswer": {
      "minimumConcepts": [
        "identifies the action (reading)",
        "forms a sentence"
      ],
      "evaluate": [
        "vocabulary",
        "sentence formation"
      ]
    },
    "image": {
      "required": true,
      "type": "illustration",
      "asset": "/assets/questions/english/person-reading.png",
      "altText": "A person sitting and reading a book"
    },
    "audio": null,
    "points": 1,
    "scoringMethod": "semantic-response",
    "explanation": "Should mention reading/book."
  },
  {
    "id": "ENG-PRO-002",
    "subject": "English",
    "skill": "Production",
    "subSkill": "Complete Sentence",
    "difficulty": "Intermediate",
    "questionType": "fill-in-the-blank",
    "question": "Complete the sentence with a sensible word: 'The sky is ___.'",
    "options": [],
    "correctAnswer": null,
    "expectedAnswer": {
      "accept": [
        "blue",
        "clear",
        "dark",
        "cloudy",
        "grey",
        "gray"
      ]
    },
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "semantic-response",
    "explanation": "Any sensible completion is accepted."
  },
  {
    "id": "ENG-PRO-003",
    "subject": "English",
    "skill": "Production",
    "subSkill": "Situational Response",
    "difficulty": "Intermediate",
    "questionType": "short-response",
    "question": "A friend says: 'Thank you for helping me.' Write a good reply.",
    "options": [],
    "correctAnswer": null,
    "expectedAnswer": {
      "minimumConcepts": [
        "polite acknowledgement"
      ]
    },
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "ai-rubric",
    "explanation": "E.g. 'You're welcome.'"
  },
  {
    "id": "ENG-PRO-004",
    "subject": "English",
    "skill": "Production",
    "subSkill": "Extended Response",
    "difficulty": "Advanced",
    "questionType": "short-response",
    "question": "In 1–2 sentences, write what you would do if you found a lost wallet.",
    "options": [],
    "correctAnswer": null,
    "expectedAnswer": {
      "minimumConcepts": [
        "describes a sensible action",
        "1-2 sentences"
      ],
      "evaluate": [
        "clarity",
        "relevance"
      ]
    },
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "ai-rubric",
    "explanation": "Relevance and clarity of the produced response."
  },
  {
    "id": "ENG-PRO-005",
    "subject": "English",
    "skill": "Production",
    "subSkill": "Conversation Response",
    "difficulty": "Advanced",
    "questionType": "conversation-response",
    "question": "The system says: 'We are planning a trip this weekend. Would you like to come?' Write your reply.",
    "options": [],
    "correctAnswer": null,
    "expectedAnswer": {
      "minimumConcepts": [
        "accepts or declines",
        "appropriate reply"
      ]
    },
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "ai-rubric",
    "explanation": "Appropriate conversational reply (accept/decline + reason)."
  },
  {
    "id": "ENG-LIT-IMG-001",
    "subject": "English",
    "skill": "Literacy",
    "subSkill": "Vocabulary Recognition",
    "difficulty": "Beginner",
    "questionType": "image-identification",
    "question": "What is this? Select the correct word.",
    "options": [
      "Dog",
      "Cat",
      "Cow",
      "Fish"
    ],
    "correctAnswer": "Dog",
    "expectedAnswer": null,
    "image": {
      "required": true,
      "type": "illustration",
      "asset": "/assets/questions/english/dog.png",
      "altText": "A dog"
    },
    "audio": null,
    "points": 1,
    "scoringMethod": "exact-match",
    "explanation": "The picture shows a dog."
  },
  {
    "id": "ENG-LIT-001",
    "subject": "English",
    "skill": "Literacy",
    "subSkill": "Letter Recognition",
    "difficulty": "Beginner",
    "questionType": "multiple-choice",
    "question": "Which one is the letter 'M'?",
    "options": [
      "N",
      "M",
      "W"
    ],
    "correctAnswer": "M",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "exact-match",
    "explanation": "Uppercase letter recognition."
  },
  {
    "id": "ENG-LIT-002",
    "subject": "English",
    "skill": "Literacy",
    "subSkill": "Phonics",
    "difficulty": "Beginner",
    "questionType": "multiple-choice",
    "question": "Which word starts with the same sound as 'sun'?",
    "options": [
      "sea",
      "dog",
      "tree"
    ],
    "correctAnswer": "sea",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "exact-match",
    "explanation": "Both start with /s/."
  },
  {
    "id": "ENG-LIT-IMG-002",
    "subject": "English",
    "skill": "Literacy",
    "subSkill": "Word-Image Match",
    "difficulty": "Beginner",
    "questionType": "image-multiple-choice",
    "question": "Which picture matches the word 'ball'?",
    "options": [
      "The ball",
      "The clock",
      "The key"
    ],
    "correctAnswer": "The ball",
    "expectedAnswer": null,
    "image": {
      "required": true,
      "type": "illustration",
      "asset": "/assets/questions/english/ball-clock-key.png",
      "altText": "Three pictures: a ball, a clock, and a key"
    },
    "audio": null,
    "points": 1,
    "scoringMethod": "exact-match",
    "explanation": "Select the ball image option."
  },
  {
    "id": "ENG-LIT-003",
    "subject": "English",
    "skill": "Literacy",
    "subSkill": "Spelling",
    "difficulty": "Intermediate",
    "questionType": "fill-in-the-blank",
    "question": "Fill in the missing letters to spell correctly: fr _ _ nd (a person you like)",
    "options": [],
    "correctAnswer": "ie",
    "expectedAnswer": {
      "accept": [
        "ie"
      ]
    },
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "normalized-match",
    "explanation": "'friend'."
  },
  {
    "id": "ENG-LIT-004",
    "subject": "English",
    "skill": "Literacy",
    "subSkill": "Sentence Recognition",
    "difficulty": "Advanced",
    "questionType": "multiple-choice",
    "question": "Which is a complete sentence?",
    "options": [
      "Running fast the",
      "The boy runs fast.",
      "fast boy the run"
    ],
    "correctAnswer": "The boy runs fast.",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "exact-match",
    "explanation": "Subject + verb + correct order."
  },
  {
    "id": "ENG-COM-001",
    "subject": "English",
    "skill": "Comprehension",
    "subSkill": "Sentence Meaning",
    "difficulty": "Beginner",
    "questionType": "multiple-choice",
    "question": "'It is raining.' What should you take?",
    "options": [
      "umbrella",
      "sunglasses",
      "fan"
    ],
    "correctAnswer": "umbrella",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "exact-match",
    "explanation": "Rain → umbrella."
  },
  {
    "id": "ENG-COM-IMG-001",
    "subject": "English",
    "skill": "Comprehension",
    "subSkill": "Image Comprehension",
    "difficulty": "Beginner",
    "questionType": "image-multiple-choice",
    "question": "Look at the picture. What is the weather like?",
    "options": [
      "Rainy",
      "Sunny",
      "Snowy"
    ],
    "correctAnswer": "Rainy",
    "expectedAnswer": null,
    "image": {
      "required": true,
      "type": "illustration",
      "asset": "/assets/questions/english/rainy-street.png",
      "altText": "A street with rain and people holding umbrellas"
    },
    "audio": null,
    "points": 1,
    "scoringMethod": "exact-match",
    "explanation": "Umbrellas and rain indicate rainy weather."
  },
  {
    "id": "ENG-COM-002",
    "subject": "English",
    "skill": "Comprehension",
    "subSkill": "Passage Detail",
    "difficulty": "Intermediate",
    "questionType": "passage-comprehension",
    "question": "Passage: 'Tom has three cats and one dog. He feeds them every morning.' How many cats does Tom have?",
    "options": [
      "one",
      "three",
      "four"
    ],
    "correctAnswer": "three",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "exact-match",
    "explanation": "Stated: three cats."
  },
  {
    "id": "ENG-COM-003",
    "subject": "English",
    "skill": "Comprehension",
    "subSkill": "Short Answer",
    "difficulty": "Intermediate",
    "questionType": "short-answer",
    "question": "Passage: 'Brushing your teeth keeps them clean and healthy.' In one word, what is this passage about?",
    "options": [],
    "correctAnswer": "teeth",
    "expectedAnswer": {
      "accept": [
        "teeth",
        "dental care",
        "brushing",
        "hygiene"
      ]
    },
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "semantic-response",
    "explanation": "Topic is dental care / teeth."
  },
  {
    "id": "ENG-COM-004",
    "subject": "English",
    "skill": "Comprehension",
    "subSkill": "Inference",
    "difficulty": "Advanced",
    "questionType": "passage-comprehension",
    "question": "Passage: 'The ground was wet and there were puddles in the morning.' What probably happened?",
    "options": [
      "It rained at night",
      "It was very sunny",
      "Someone swept it"
    ],
    "correctAnswer": "It rained at night",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "exact-match",
    "explanation": "Inference from wet ground + puddles."
  },
  {
    "id": "ENG-CNV-001",
    "subject": "English",
    "skill": "Conversation",
    "subSkill": "Greeting",
    "difficulty": "Beginner",
    "questionType": "situational-response",
    "question": "The system says: 'Hello! How are you?' Write your reply.",
    "options": [],
    "correctAnswer": null,
    "expectedAnswer": {
      "minimumConcepts": [
        "appropriate greeting reply"
      ]
    },
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "ai-rubric",
    "explanation": "E.g. 'I am fine, thank you.'"
  },
  {
    "id": "ENG-CNV-002",
    "subject": "English",
    "skill": "Conversation",
    "subSkill": "Simple Exchange",
    "difficulty": "Beginner",
    "questionType": "short-spoken-answer",
    "question": "Listen and respond.",
    "audioScript": "What is your name?",
    "options": [],
    "correctAnswer": null,
    "expectedAnswer": {
      "minimumConcepts": [
        "states a name"
      ]
    },
    "image": null,
    "audio": {
      "required": true,
      "asset": "/assets/questions/english/audio/what-is-your-name.mp3"
    },
    "points": 1,
    "scoringMethod": "semantic-response",
    "explanation": "Should state a name."
  },
  {
    "id": "ENG-CNV-IMG-001",
    "subject": "English",
    "skill": "Conversation",
    "subSkill": "Image-Based Conversation",
    "difficulty": "Intermediate",
    "questionType": "image-based-conversation",
    "question": "Look at the picture. You are at this shop. Write how you would ask the price of the item.",
    "options": [],
    "correctAnswer": null,
    "expectedAnswer": {
      "minimumConcepts": [
        "asks about price politely"
      ]
    },
    "image": {
      "required": true,
      "type": "illustration",
      "asset": "/assets/questions/english/shop-counter.png",
      "altText": "A shop counter with a pen on display"
    },
    "audio": null,
    "points": 1,
    "scoringMethod": "ai-rubric",
    "explanation": "E.g. 'How much is this pen?'"
  },
  {
    "id": "ENG-CNV-003",
    "subject": "English",
    "skill": "Conversation",
    "subSkill": "Follow-up",
    "difficulty": "Intermediate",
    "questionType": "follow-up-response",
    "question": "The system says: 'I went to the park today. What did you do?' Write your reply.",
    "options": [],
    "correctAnswer": null,
    "expectedAnswer": {
      "minimumConcepts": [
        "relevant reply",
        "describes an activity"
      ]
    },
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "ai-rubric",
    "explanation": "Relevant conversational reply."
  },
  {
    "id": "ENG-CNV-004",
    "subject": "English",
    "skill": "Conversation",
    "subSkill": "Extended",
    "difficulty": "Advanced",
    "questionType": "follow-up-response",
    "question": "The system says: 'Tell me about your plans for the weekend.' Write a 1–2 sentence reply.",
    "options": [],
    "correctAnswer": null,
    "expectedAnswer": {
      "minimumConcepts": [
        "coherent reply",
        "future plans"
      ]
    },
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "ai-rubric",
    "explanation": "Coherent conversational response about future plans."
  },
  {
    "id": "MATH-NUM-IMG-001",
    "subject": "Mathematics",
    "skill": "Number Sense",
    "subSkill": "Counting",
    "difficulty": "Beginner",
    "questionType": "image-multiple-choice",
    "question": "How many apples are there?",
    "options": [
      "2",
      "3",
      "4"
    ],
    "correctAnswer": "3",
    "expectedAnswer": null,
    "image": {
      "required": true,
      "type": "illustration",
      "asset": "/assets/questions/math/apples-3.png",
      "altText": "Three apples in a row"
    },
    "audio": null,
    "points": 1,
    "scoringMethod": "exact-match",
    "explanation": "Count = 3."
  },
  {
    "id": "MATH-NUM-001",
    "subject": "Mathematics",
    "skill": "Number Sense",
    "subSkill": "Compare",
    "difficulty": "Beginner",
    "questionType": "multiple-choice",
    "question": "Which number is bigger?",
    "options": [
      "7",
      "4",
      "2"
    ],
    "correctAnswer": "7",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "exact-match",
    "explanation": "7 is largest."
  },
  {
    "id": "MATH-NUM-002",
    "subject": "Mathematics",
    "skill": "Number Sense",
    "subSkill": "Ordering",
    "difficulty": "Intermediate",
    "questionType": "ordering",
    "question": "Arrange these numbers from smallest to largest: 3, 1, 2",
    "options": [
      "3",
      "1",
      "2"
    ],
    "correctAnswer": "1,2,3",
    "expectedAnswer": {
      "orderedAnswer": [
        "1",
        "2",
        "3"
      ]
    },
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "ordered-match",
    "explanation": "Ascending order: 1, 2, 3."
  },
  {
    "id": "MATH-NUM-003",
    "subject": "Mathematics",
    "skill": "Number Sense",
    "subSkill": "Place Value",
    "difficulty": "Intermediate",
    "questionType": "numeric-answer",
    "question": "In the number 47, what is the tens digit?",
    "options": [],
    "correctAnswer": "4",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "numeric-match",
    "explanation": "Tens digit = 4."
  },
  {
    "id": "MATH-NUM-004",
    "subject": "Mathematics",
    "skill": "Number Sense",
    "subSkill": "Rounding",
    "difficulty": "Advanced",
    "questionType": "numeric-answer",
    "question": "Round 68 to the nearest ten.",
    "options": [],
    "correctAnswer": "70",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "numeric-match",
    "explanation": "68 → 70."
  },
  {
    "id": "MATH-ARI-001",
    "subject": "Mathematics",
    "skill": "Basic Arithmetic",
    "subSkill": "Add",
    "difficulty": "Beginner",
    "questionType": "numeric-answer",
    "question": "What is 2 + 3?",
    "options": [],
    "correctAnswer": "5",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "numeric-match",
    "explanation": "2+3=5."
  },
  {
    "id": "MATH-ARI-002",
    "subject": "Mathematics",
    "skill": "Basic Arithmetic",
    "subSkill": "Subtract",
    "difficulty": "Beginner",
    "questionType": "numeric-answer",
    "question": "What is 6 − 2?",
    "options": [],
    "correctAnswer": "4",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "numeric-match",
    "explanation": "6-2=4."
  },
  {
    "id": "MATH-ARI-003",
    "subject": "Mathematics",
    "skill": "Basic Arithmetic",
    "subSkill": "Fill Blank",
    "difficulty": "Beginner",
    "questionType": "fill-in-the-blank",
    "question": "Fill in the blank: 8 + ___ = 15",
    "options": [],
    "correctAnswer": "7",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "numeric-match",
    "explanation": "15-8=7."
  },
  {
    "id": "MATH-ARI-004",
    "subject": "Mathematics",
    "skill": "Basic Arithmetic",
    "subSkill": "Two-step",
    "difficulty": "Intermediate",
    "questionType": "numeric-answer",
    "question": "Calculate: 5 + 3 − 2",
    "options": [],
    "correctAnswer": "6",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "numeric-match",
    "explanation": "5+3-2=6."
  },
  {
    "id": "MATH-ARI-005",
    "subject": "Mathematics",
    "skill": "Basic Arithmetic",
    "subSkill": "Order of Ops",
    "difficulty": "Intermediate",
    "questionType": "multiple-choice",
    "question": "What is 2 + 3 × 2?",
    "options": [
      "10",
      "8",
      "12"
    ],
    "correctAnswer": "8",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "exact-match",
    "explanation": "3×2=6, +2=8."
  },
  {
    "id": "MATH-ARI-006",
    "subject": "Mathematics",
    "skill": "Basic Arithmetic",
    "subSkill": "Multi-step",
    "difficulty": "Advanced",
    "questionType": "numeric-answer",
    "question": "Calculate: (4 + 6) ÷ 2",
    "options": [],
    "correctAnswer": "5",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "numeric-match",
    "explanation": "10÷2=5."
  },
  {
    "id": "MATH-ADS-001",
    "subject": "Mathematics",
    "skill": "Addition & Subtraction",
    "subSkill": "Add small",
    "difficulty": "Beginner",
    "questionType": "numeric-answer",
    "question": "What is 7 + 1?",
    "options": [],
    "correctAnswer": "8",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "numeric-match",
    "explanation": "7+1=8."
  },
  {
    "id": "MATH-ADS-002",
    "subject": "Mathematics",
    "skill": "Addition & Subtraction",
    "subSkill": "Subtract small",
    "difficulty": "Beginner",
    "questionType": "fill-in-the-blank",
    "question": "Fill in the blank: 9 − ___ = 4",
    "options": [],
    "correctAnswer": "5",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "numeric-match",
    "explanation": "9-4=5."
  },
  {
    "id": "MATH-ADS-003",
    "subject": "Mathematics",
    "skill": "Addition & Subtraction",
    "subSkill": "Two-digit add",
    "difficulty": "Intermediate",
    "questionType": "numeric-answer",
    "question": "What is 24 + 18?",
    "options": [],
    "correctAnswer": "42",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "numeric-match",
    "explanation": "24+18=42."
  },
  {
    "id": "MATH-ADS-004",
    "subject": "Mathematics",
    "skill": "Addition & Subtraction",
    "subSkill": "Two-digit sub",
    "difficulty": "Intermediate",
    "questionType": "numeric-answer",
    "question": "What is 53 − 27?",
    "options": [],
    "correctAnswer": "26",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "numeric-match",
    "explanation": "53-27=26."
  },
  {
    "id": "MATH-ADS-005",
    "subject": "Mathematics",
    "skill": "Addition & Subtraction",
    "subSkill": "Regrouping",
    "difficulty": "Advanced",
    "questionType": "numeric-answer",
    "question": "What is 205 − 138?",
    "options": [],
    "correctAnswer": "67",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "numeric-match",
    "explanation": "205-138=67."
  },
  {
    "id": "MATH-MUL-001",
    "subject": "Mathematics",
    "skill": "Multiplication & Division",
    "subSkill": "Times table",
    "difficulty": "Beginner",
    "questionType": "numeric-answer",
    "question": "What is 3 × 2?",
    "options": [],
    "correctAnswer": "6",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "numeric-match",
    "explanation": "3×2=6."
  },
  {
    "id": "MATH-MUL-002",
    "subject": "Mathematics",
    "skill": "Multiplication & Division",
    "subSkill": "Divide simple",
    "difficulty": "Beginner",
    "questionType": "numeric-answer",
    "question": "Calculate 8 ÷ 2.",
    "options": [],
    "correctAnswer": "4",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "numeric-match",
    "explanation": "8÷2=4."
  },
  {
    "id": "MATH-MUL-003",
    "subject": "Mathematics",
    "skill": "Multiplication & Division",
    "subSkill": "Times table mid",
    "difficulty": "Intermediate",
    "questionType": "numeric-answer",
    "question": "What is 7 × 6?",
    "options": [],
    "correctAnswer": "42",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "numeric-match",
    "explanation": "7×6=42."
  },
  {
    "id": "MATH-MUL-004",
    "subject": "Mathematics",
    "skill": "Multiplication & Division",
    "subSkill": "Divide mid",
    "difficulty": "Intermediate",
    "questionType": "numeric-answer",
    "question": "Calculate 56 ÷ 8.",
    "options": [],
    "correctAnswer": "7",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "numeric-match",
    "explanation": "56÷8=7."
  },
  {
    "id": "MATH-MUL-005",
    "subject": "Mathematics",
    "skill": "Multiplication & Division",
    "subSkill": "Multi-digit",
    "difficulty": "Advanced",
    "questionType": "numeric-answer",
    "question": "What is 12 × 12?",
    "options": [],
    "correctAnswer": "144",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "numeric-match",
    "explanation": "12×12=144."
  },
  {
    "id": "MATH-FRA-IMG-001",
    "subject": "Mathematics",
    "skill": "Fractions & Decimals",
    "subSkill": "Recognition",
    "difficulty": "Beginner",
    "questionType": "image-multiple-choice",
    "question": "Which fraction is shown by the shaded part?",
    "options": [
      "1/2",
      "1/3",
      "1/4"
    ],
    "correctAnswer": "1/2",
    "expectedAnswer": null,
    "image": {
      "required": true,
      "type": "illustration",
      "asset": "/assets/questions/math/half-shaded-circle.png",
      "altText": "A circle with one half shaded"
    },
    "audio": null,
    "points": 1,
    "scoringMethod": "exact-match",
    "explanation": "Half is shaded = 1/2."
  },
  {
    "id": "MATH-FRA-001",
    "subject": "Mathematics",
    "skill": "Fractions & Decimals",
    "subSkill": "Compare",
    "difficulty": "Beginner",
    "questionType": "multiple-choice",
    "question": "Which fraction is bigger?",
    "options": [
      "1/2",
      "1/4",
      "1/8"
    ],
    "correctAnswer": "1/2",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "exact-match",
    "explanation": "1/2 is largest."
  },
  {
    "id": "MATH-FRA-002",
    "subject": "Mathematics",
    "skill": "Fractions & Decimals",
    "subSkill": "Matching",
    "difficulty": "Intermediate",
    "questionType": "matching",
    "question": "Match each fraction to its decimal.",
    "options": [
      "1/2",
      "1/4",
      "3/4"
    ],
    "correctAnswer": "1/2=0.5; 1/4=0.25; 3/4=0.75",
    "expectedAnswer": {
      "pairs": {
        "1/2": "0.5",
        "1/4": "0.25",
        "3/4": "0.75"
      }
    },
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "matching-pairs",
    "explanation": "1/2=0.5, 1/4=0.25, 3/4=0.75."
  },
  {
    "id": "MATH-FRA-003",
    "subject": "Mathematics",
    "skill": "Fractions & Decimals",
    "subSkill": "Equivalent",
    "difficulty": "Intermediate",
    "questionType": "multiple-choice",
    "question": "Which fraction equals 1/2?",
    "options": [
      "2/4",
      "1/3",
      "3/5"
    ],
    "correctAnswer": "2/4",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "exact-match",
    "explanation": "2/4=1/2."
  },
  {
    "id": "MATH-FRA-004",
    "subject": "Mathematics",
    "skill": "Fractions & Decimals",
    "subSkill": "Operations",
    "difficulty": "Advanced",
    "questionType": "numeric-answer",
    "question": "What is 1/4 + 1/4? (write as a fraction)",
    "options": [],
    "correctAnswer": "1/2",
    "expectedAnswer": {
      "accept": [
        "1/2",
        "2/4",
        "0.5"
      ]
    },
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "normalized-match",
    "explanation": "1/4+1/4=1/2."
  },
  {
    "id": "MATH-REA-001",
    "subject": "Mathematics",
    "skill": "Mathematical Reasoning",
    "subSkill": "Pattern",
    "difficulty": "Beginner",
    "questionType": "fill-in-the-blank",
    "question": "What comes next? 2, 4, 6, ___",
    "options": [],
    "correctAnswer": "8",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "numeric-match",
    "explanation": "+2 → 8."
  },
  {
    "id": "MATH-REA-002",
    "subject": "Mathematics",
    "skill": "Mathematical Reasoning",
    "subSkill": "Odd one out",
    "difficulty": "Beginner",
    "questionType": "multiple-choice",
    "question": "Which number does NOT belong? 2, 4, 5, 6",
    "options": [
      "4",
      "5",
      "6"
    ],
    "correctAnswer": "5",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "exact-match",
    "explanation": "5 is odd; the others are even."
  },
  {
    "id": "MATH-REA-003",
    "subject": "Mathematics",
    "skill": "Mathematical Reasoning",
    "subSkill": "Pattern mid",
    "difficulty": "Intermediate",
    "questionType": "fill-in-the-blank",
    "question": "What comes next? 5, 10, 20, 40, ___",
    "options": [],
    "correctAnswer": "80",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "numeric-match",
    "explanation": "×2 → 80."
  },
  {
    "id": "MATH-REA-004",
    "subject": "Mathematics",
    "skill": "Mathematical Reasoning",
    "subSkill": "Multi-step",
    "difficulty": "Intermediate",
    "questionType": "numeric-answer",
    "question": "A number doubled, then plus 3, equals 11. What is the number?",
    "options": [],
    "correctAnswer": "4",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "numeric-match",
    "explanation": "2×4+3=11."
  },
  {
    "id": "MATH-REA-005",
    "subject": "Mathematics",
    "skill": "Mathematical Reasoning",
    "subSkill": "Explain Reasoning",
    "difficulty": "Advanced",
    "questionType": "math-reasoning",
    "question": "Sara says 1/3 is bigger than 1/2 because 3 is bigger than 2. Is she correct? Explain your reasoning.",
    "options": [],
    "correctAnswer": null,
    "expectedAnswer": {
      "minimumConcepts": [
        "states Sara is wrong",
        "explains 1/2 > 1/3 (smaller denominator = bigger piece)"
      ]
    },
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "ai-rubric",
    "explanation": "1/2 > 1/3; a larger denominator means smaller pieces."
  },
  {
    "id": "MATH-WOR-001",
    "subject": "Mathematics",
    "skill": "Word Problems",
    "subSkill": "Add context",
    "difficulty": "Beginner",
    "questionType": "math-problem-solving",
    "question": "Sam has 5 apples and gets 3 more. How many apples does Sam have now?",
    "options": [],
    "correctAnswer": "8",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "numeric-match",
    "explanation": "5+3=8."
  },
  {
    "id": "MATH-WOR-002",
    "subject": "Mathematics",
    "skill": "Word Problems",
    "subSkill": "Subtract context",
    "difficulty": "Beginner",
    "questionType": "math-problem-solving",
    "question": "There are 8 birds on a tree. 3 fly away. How many birds are left?",
    "options": [],
    "correctAnswer": "5",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "numeric-match",
    "explanation": "8-3=5."
  },
  {
    "id": "MATH-WOR-003",
    "subject": "Mathematics",
    "skill": "Word Problems",
    "subSkill": "Multiply context",
    "difficulty": "Intermediate",
    "questionType": "math-problem-solving",
    "question": "A box holds 4 pens. How many pens are in 3 boxes?",
    "options": [],
    "correctAnswer": "12",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "numeric-match",
    "explanation": "4×3=12."
  },
  {
    "id": "MATH-WOR-004",
    "subject": "Mathematics",
    "skill": "Word Problems",
    "subSkill": "Money",
    "difficulty": "Intermediate",
    "questionType": "math-problem-solving",
    "question": "A pen costs ₹15 and a book costs ₹20. What is the total cost?",
    "options": [],
    "correctAnswer": "35",
    "expectedAnswer": {
      "accept": [
        "35",
        "₹35"
      ]
    },
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "numeric-match",
    "explanation": "15+20=35."
  },
  {
    "id": "MATH-WOR-005",
    "subject": "Mathematics",
    "skill": "Word Problems",
    "subSkill": "Multi-step",
    "difficulty": "Advanced",
    "questionType": "math-problem-solving",
    "question": "Amit had ₹50. He bought a toy for ₹30 and a snack for ₹12. How much money is left?",
    "options": [],
    "correctAnswer": "8",
    "expectedAnswer": {
      "accept": [
        "8",
        "₹8"
      ]
    },
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "numeric-match",
    "explanation": "50-30-12=8."
  },
  {
    "id": "MATH-ALG-001",
    "subject": "Mathematics",
    "skill": "Algebraic Thinking",
    "subSkill": "Missing number",
    "difficulty": "Beginner",
    "questionType": "fill-in-the-blank",
    "question": "Fill in the blank: 3 + ___ = 7",
    "options": [],
    "correctAnswer": "4",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "numeric-match",
    "explanation": "7-3=4."
  },
  {
    "id": "MATH-ALG-002",
    "subject": "Mathematics",
    "skill": "Algebraic Thinking",
    "subSkill": "Simple equation",
    "difficulty": "Intermediate",
    "questionType": "numeric-answer",
    "question": "If x + 2 = 9, what is x?",
    "options": [],
    "correctAnswer": "7",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "numeric-match",
    "explanation": "9-2=7."
  },
  {
    "id": "MATH-ALG-003",
    "subject": "Mathematics",
    "skill": "Algebraic Thinking",
    "subSkill": "Expression",
    "difficulty": "Intermediate",
    "questionType": "numeric-answer",
    "question": "If y = 3, what is 2y + 1?",
    "options": [],
    "correctAnswer": "7",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "numeric-match",
    "explanation": "2×3+1=7."
  },
  {
    "id": "MATH-ALG-004",
    "subject": "Mathematics",
    "skill": "Algebraic Thinking",
    "subSkill": "Solve",
    "difficulty": "Advanced",
    "questionType": "numeric-answer",
    "question": "If 3x = 12, what is x?",
    "options": [],
    "correctAnswer": "4",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "numeric-match",
    "explanation": "12÷3=4."
  },
  {
    "id": "MATH-GEO-IMG-001",
    "subject": "Mathematics",
    "skill": "Geometry & Measurement",
    "subSkill": "Shape ID",
    "difficulty": "Beginner",
    "questionType": "image-multiple-choice",
    "question": "Which shape has 4 equal sides?",
    "options": [
      "Triangle",
      "Square",
      "Circle"
    ],
    "correctAnswer": "Square",
    "expectedAnswer": null,
    "image": {
      "required": true,
      "type": "illustration",
      "asset": "/assets/questions/math/shapes-triangle-square-circle.png",
      "altText": "A triangle, a square, and a circle"
    },
    "audio": null,
    "points": 1,
    "scoringMethod": "exact-match",
    "explanation": "A square has 4 equal sides."
  },
  {
    "id": "MATH-GEO-IMG-002",
    "subject": "Mathematics",
    "skill": "Geometry & Measurement",
    "subSkill": "Measurement",
    "difficulty": "Beginner",
    "questionType": "image-based-short-answer",
    "question": "Look at the ruler. How long is the pencil in centimetres?",
    "options": [],
    "correctAnswer": "6",
    "expectedAnswer": {
      "accept": [
        "6",
        "6 cm",
        "6cm"
      ]
    },
    "image": {
      "required": true,
      "type": "illustration",
      "asset": "/assets/questions/math/ruler-pencil-6cm.png",
      "altText": "A pencil measured against a ruler, ending at 6 cm"
    },
    "audio": null,
    "points": 1,
    "scoringMethod": "numeric-match",
    "explanation": "The pencil ends at 6 cm."
  },
  {
    "id": "MATH-GEO-001",
    "subject": "Mathematics",
    "skill": "Geometry & Measurement",
    "subSkill": "Perimeter",
    "difficulty": "Intermediate",
    "questionType": "numeric-answer",
    "question": "A square has sides of 5 cm. What is its perimeter in cm?",
    "options": [],
    "correctAnswer": "20",
    "expectedAnswer": {
      "accept": [
        "20",
        "20 cm"
      ]
    },
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "numeric-match",
    "explanation": "4×5=20 cm."
  },
  {
    "id": "MATH-GEO-002",
    "subject": "Mathematics",
    "skill": "Geometry & Measurement",
    "subSkill": "Area",
    "difficulty": "Intermediate",
    "questionType": "numeric-answer",
    "question": "A rectangle is 4 cm by 3 cm. What is its area in cm²?",
    "options": [],
    "correctAnswer": "12",
    "expectedAnswer": {
      "accept": [
        "12",
        "12 cm2",
        "12 cm²"
      ]
    },
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "numeric-match",
    "explanation": "4×3=12 cm²."
  },
  {
    "id": "MATH-GEO-003",
    "subject": "Mathematics",
    "skill": "Geometry & Measurement",
    "subSkill": "Angles",
    "difficulty": "Advanced",
    "questionType": "numeric-answer",
    "question": "How many degrees are in a right angle?",
    "options": [],
    "correctAnswer": "90",
    "expectedAnswer": {
      "accept": [
        "90",
        "90 degrees",
        "90°"
      ]
    },
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "numeric-match",
    "explanation": "A right angle = 90°."
  },
  {
    "id": "MATH-DAT-IMG-001",
    "subject": "Mathematics",
    "skill": "Data Interpretation",
    "subSkill": "Read Chart",
    "difficulty": "Beginner",
    "questionType": "data-chart",
    "question": "Look at the bar chart. Which fruit has the highest value?",
    "options": [
      "Apples",
      "Bananas",
      "Cherries"
    ],
    "correctAnswer": "Bananas",
    "expectedAnswer": null,
    "image": {
      "required": true,
      "type": "illustration",
      "asset": "/assets/questions/math/bar-chart-fruits.png",
      "altText": "A bar chart: Apples 3, Bananas 5, Cherries 2"
    },
    "audio": null,
    "points": 1,
    "scoringMethod": "exact-match",
    "explanation": "Bananas has the tallest bar (5)."
  },
  {
    "id": "MATH-DAT-001",
    "subject": "Mathematics",
    "skill": "Data Interpretation",
    "subSkill": "Least",
    "difficulty": "Beginner",
    "questionType": "multiple-choice",
    "question": "Scores — Ravi: 8, Sara: 6, Tom: 9. Who scored the least?",
    "options": [
      "Ravi",
      "Sara",
      "Tom"
    ],
    "correctAnswer": "Sara",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "exact-match",
    "explanation": "6 is lowest."
  },
  {
    "id": "MATH-DAT-002",
    "subject": "Mathematics",
    "skill": "Data Interpretation",
    "subSkill": "Total",
    "difficulty": "Intermediate",
    "questionType": "numeric-answer",
    "question": "A shop sold cakes — Mon: 4, Tue: 6, Wed: 5. How many cakes in total?",
    "options": [],
    "correctAnswer": "15",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "numeric-match",
    "explanation": "4+6+5=15."
  },
  {
    "id": "MATH-DAT-IMG-002",
    "subject": "Mathematics",
    "skill": "Data Interpretation",
    "subSkill": "Chart Difference",
    "difficulty": "Intermediate",
    "questionType": "data-chart",
    "question": "Look at the bar chart. How many more students are in Class A than Class B?",
    "options": [],
    "correctAnswer": "7",
    "expectedAnswer": null,
    "image": {
      "required": true,
      "type": "illustration",
      "asset": "/assets/questions/math/bar-chart-classes.png",
      "altText": "A bar chart: Class A 25, Class B 18"
    },
    "audio": null,
    "points": 1,
    "scoringMethod": "numeric-match",
    "explanation": "25-18=7."
  },
  {
    "id": "MATH-DAT-003",
    "subject": "Mathematics",
    "skill": "Data Interpretation",
    "subSkill": "Average",
    "difficulty": "Advanced",
    "questionType": "numeric-answer",
    "question": "Find the average of 4, 6, and 8.",
    "options": [],
    "correctAnswer": "6",
    "expectedAnswer": null,
    "image": null,
    "audio": null,
    "points": 1,
    "scoringMethod": "numeric-match",
    "explanation": "(4+6+8)/3=6."
  }
];


const REQUIRED_ASSETS = {
  "images": [
    "/assets/questions/english/apple.png",
    "/assets/questions/english/ball-clock-key.png",
    "/assets/questions/english/dog.png",
    "/assets/questions/english/park-scene.png",
    "/assets/questions/english/person-reading.png",
    "/assets/questions/english/rainy-street.png",
    "/assets/questions/english/shop-counter.png",
    "/assets/questions/math/apples-3.png",
    "/assets/questions/math/bar-chart-classes.png",
    "/assets/questions/math/bar-chart-fruits.png",
    "/assets/questions/math/half-shaded-circle.png",
    "/assets/questions/math/ruler-pencil-6cm.png",
    "/assets/questions/math/shapes-triangle-square-circle.png"
  ],
  "audio": [
    "/assets/questions/english/audio/bus-three-oclock.mp3",
    "/assets/questions/english/audio/cat.mp3",
    "/assets/questions/english/audio/coat-and-gloves.mp3",
    "/assets/questions/english/audio/i-drink-milk.mp3",
    "/assets/questions/english/audio/i-have-a-red-ball.mp3",
    "/assets/questions/english/audio/i-like-ice-cream.mp3",
    "/assets/questions/english/audio/ravi-late-alarm.mp3",
    "/assets/questions/english/audio/tap-a-color.mp3",
    "/assets/questions/english/audio/what-is-your-name.mp3"
  ]
};

module.exports = { ADAPTIVE_SCREENING_BANK, REQUIRED_ASSETS };
