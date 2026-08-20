/**
 * Universal Question Bank — 100 Questions (Beginner → Advanced)
 * 
 * Single adaptive question bank for ALL students.
 * AI analyzes performance and recommends personalized next questions.
 * 
 * Structure:
 *   - Beginner (Q1-Q35): Basic recognition, simple matching, single-step
 *   - Intermediate (Q36-Q70): Multi-step, comprehension, application
 *   - Advanced (Q71-Q100): Inference, synthesis, complex reasoning
 * 
 * Topics: Phonics & Sound, Reading & Comprehension, Writing & Spelling,
 *         Visual-Spatial, Math & Number Sense, Listening & Audio
 * 
 * LD Triggers: Dyslexia, Dysgraphia, Dyscalculia, Mixed
 * 
 * Generated from: Question_Bank_100_Background_Director.xlsx
 * Date: August 20, 2026
 */

const QUESTION_BANK = [
  {
    "id": "q_001",
    "question_number": 1,
    "difficulty": "beginner",
    "difficulty_score": 1,
    "topic": "Phonics & Sound",
    "sub_topic": "Phoneme Isolation",
    "ld_trigger": "dyslexia",
    "clinical_metric": "Phoneme_Isolation",
    "question_type": "audio_image_tap",
    "question_text": "Find the object that starts with the 'Aaa' sound",
    "options": [
      "Apple",
      "Banana",
      "Cat"
    ],
    "correct_answer": "Apple",
    "requires_audio": true,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": true,
    "tags": [
      "letter_sounds",
      "initial_sound"
    ]
  },
  {
    "id": "q_002",
    "question_number": 2,
    "difficulty": "beginner",
    "difficulty_score": 1,
    "topic": "Phonics & Sound",
    "sub_topic": "Phoneme Isolation",
    "ld_trigger": "dyslexia",
    "clinical_metric": "Phoneme_Isolation",
    "question_type": "audio_image_tap",
    "question_text": "Which word starts with 'Bbb'?",
    "options": [
      "Ball",
      "Dog",
      "Egg"
    ],
    "correct_answer": "Ball",
    "requires_audio": true,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": true,
    "tags": [
      "letter_sounds",
      "initial_sound"
    ]
  },
  {
    "id": "q_003",
    "question_number": 3,
    "difficulty": "beginner",
    "difficulty_score": 1,
    "topic": "Phonics & Sound",
    "sub_topic": "Phoneme Blending",
    "ld_trigger": "dyslexia",
    "clinical_metric": "Phoneme_Blending",
    "question_type": "audio_image_tap",
    "question_text": "Listen and tap: 'C' + 'A' + 'T'",
    "options": [
      "Cat",
      "Dog",
      "Bat"
    ],
    "correct_answer": "Cat",
    "requires_audio": true,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": true,
    "tags": [
      "sound_blending",
      "cvc_words"
    ]
  },
  {
    "id": "q_004",
    "question_number": 4,
    "difficulty": "beginner",
    "difficulty_score": 1,
    "topic": "Phonics & Sound",
    "sub_topic": "Vowel Recognition",
    "ld_trigger": "dyslexia",
    "clinical_metric": "Vowel_Recognition",
    "question_type": "mcq",
    "question_text": "Which letter is a vowel?",
    "options": [
      "b",
      "a",
      "c"
    ],
    "correct_answer": "a",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "vowels",
      "letter_identification"
    ]
  },
  {
    "id": "q_005",
    "question_number": 5,
    "difficulty": "beginner",
    "difficulty_score": 1,
    "topic": "Phonics & Sound",
    "sub_topic": "Rhyming Words",
    "ld_trigger": "dyslexia",
    "clinical_metric": "Rhyming_Sounds",
    "question_type": "audio_image_tap",
    "question_text": "What rhymes with 'cat'?",
    "options": [
      "Hat",
      "Dog",
      "Fish"
    ],
    "correct_answer": "Hat",
    "requires_audio": true,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": true,
    "tags": [
      "rhyming",
      "phonetic_awareness"
    ]
  },
  {
    "id": "q_006",
    "question_number": 6,
    "difficulty": "beginner",
    "difficulty_score": 1,
    "topic": "Phonics & Sound",
    "sub_topic": "Consonant Recognition",
    "ld_trigger": "dyslexia",
    "clinical_metric": "Consonant_ID",
    "question_type": "mcq",
    "question_text": "Which is a consonant?",
    "options": [
      "a",
      "b",
      "e"
    ],
    "correct_answer": "b",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "consonants",
      "letter_identification"
    ]
  },
  {
    "id": "q_007",
    "question_number": 7,
    "difficulty": "beginner",
    "difficulty_score": 1,
    "topic": "Phonics & Sound",
    "sub_topic": "Word Sound Matching",
    "ld_trigger": "dyslexia",
    "clinical_metric": "Sound_Word_Match",
    "question_type": "audio_image_tap",
    "question_text": "Tap the picture that matches 'moo'",
    "options": [
      "Cow",
      "Bird",
      "Fish"
    ],
    "correct_answer": "Cow",
    "requires_audio": true,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": true,
    "tags": [
      "animal_sounds",
      "onomatopoeia"
    ]
  },
  {
    "id": "q_008",
    "question_number": 8,
    "difficulty": "beginner",
    "difficulty_score": 1,
    "topic": "Phonics & Sound",
    "sub_topic": "Initial Sound Recognition",
    "ld_trigger": "dyslexia",
    "clinical_metric": "Initial_Sound",
    "question_type": "mcq",
    "question_text": "What sound does 'sun' start with?",
    "options": [
      "S",
      "T",
      "M"
    ],
    "correct_answer": "S",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "initial_sound",
      "letter_sounds"
    ]
  },
  {
    "id": "q_009",
    "question_number": 9,
    "difficulty": "beginner",
    "difficulty_score": 1,
    "topic": "Reading & Comprehension",
    "sub_topic": "Sight Word Recognition",
    "ld_trigger": "dyslexia",
    "clinical_metric": "Sight_Words",
    "question_type": "audio_image_tap",
    "question_text": "Tap the word 'the'",
    "options": [
      "the",
      "cat",
      "run"
    ],
    "correct_answer": "the",
    "requires_audio": true,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "sight_words",
      "high_frequency"
    ]
  },
  {
    "id": "q_010",
    "question_number": 10,
    "difficulty": "beginner",
    "difficulty_score": 1,
    "topic": "Reading & Comprehension",
    "sub_topic": "Simple Word Matching",
    "ld_trigger": "dyslexia",
    "clinical_metric": "Word_Matching",
    "question_type": "mcq",
    "question_text": "Which word says 'dog'?",
    "options": [
      "dog",
      "cat",
      "pig"
    ],
    "correct_answer": "dog",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "word_recognition",
      "decoding"
    ]
  },
  {
    "id": "q_011",
    "question_number": 11,
    "difficulty": "beginner",
    "difficulty_score": 1,
    "topic": "Reading & Comprehension",
    "sub_topic": "Picture-Text Matching",
    "ld_trigger": "dyslexia",
    "clinical_metric": "Picture_Text_Match",
    "question_type": "audio_image_tap",
    "question_text": "Match 'apple' with the correct picture",
    "options": [
      "Apple",
      "Orange",
      "Grape"
    ],
    "correct_answer": "Apple",
    "requires_audio": true,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": true,
    "tags": [
      "vocabulary",
      "visual_matching"
    ]
  },
  {
    "id": "q_012",
    "question_number": 12,
    "difficulty": "beginner",
    "difficulty_score": 1,
    "topic": "Reading & Comprehension",
    "sub_topic": "Simple Sentence Understanding",
    "ld_trigger": "dyslexia",
    "clinical_metric": "Sentence_Comprehension",
    "question_type": "mcq",
    "question_text": "The cat is ___. (Choose: happy/sad/red)",
    "options": [
      "happy",
      "sad",
      "red"
    ],
    "correct_answer": "happy",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "sentence_completion",
      "context_clues"
    ]
  },
  {
    "id": "q_013",
    "question_number": 13,
    "difficulty": "beginner",
    "difficulty_score": 1,
    "topic": "Reading & Comprehension",
    "sub_topic": "Story Sequencing",
    "ld_trigger": "dyslexia",
    "clinical_metric": "Sequence_Order",
    "question_type": "drag_order",
    "question_text": "Arrange: First, a caterpillar. Then, it becomes a butterfly.",
    "options": [
      "Caterpillar",
      "Butterfly"
    ],
    "correct_answer": "Caterpillar | Butterfly",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "sequencing",
      "story_order"
    ]
  },
  {
    "id": "q_014",
    "question_number": 14,
    "difficulty": "beginner",
    "difficulty_score": 1,
    "topic": "Reading & Comprehension",
    "sub_topic": "Word Classification",
    "ld_trigger": "dyslexia",
    "clinical_metric": "Category_Matching",
    "question_type": "mcq",
    "question_text": "Which is an animal?",
    "options": [
      "car",
      "dog",
      "apple"
    ],
    "correct_answer": "dog",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "categorization",
      "vocabulary"
    ]
  },
  {
    "id": "q_015",
    "question_number": 15,
    "difficulty": "beginner",
    "difficulty_score": 1,
    "topic": "Writing & Spelling",
    "sub_topic": "Letter Tracing",
    "ld_trigger": "dysgraphia",
    "clinical_metric": "Letter_Tracing",
    "question_type": "trace",
    "question_text": "Trace the letter 'A'",
    "options": [
      "Letter outline"
    ],
    "correct_answer": "A",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "fine_motor",
      "letter_formation"
    ]
  },
  {
    "id": "q_016",
    "question_number": 16,
    "difficulty": "beginner",
    "difficulty_score": 1,
    "topic": "Writing & Spelling",
    "sub_topic": "Letter Copying",
    "ld_trigger": "dysgraphia",
    "clinical_metric": "Letter_Copying",
    "question_type": "mcq",
    "question_text": "Copy the letter and match: 'B'",
    "options": [
      "B",
      "D",
      "P"
    ],
    "correct_answer": "B",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": true,
    "requires_image": false,
    "tags": [
      "letter_formation",
      "writing"
    ]
  },
  {
    "id": "q_017",
    "question_number": 17,
    "difficulty": "beginner",
    "difficulty_score": 1,
    "topic": "Writing & Spelling",
    "sub_topic": "Simple Spelling",
    "ld_trigger": "dysgraphia",
    "clinical_metric": "Simple_Spelling",
    "question_type": "fill_blank",
    "question_text": "Complete: c_t",
    "options": [
      "cat",
      "cot",
      "cut"
    ],
    "correct_answer": "cat",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": true,
    "requires_image": false,
    "tags": [
      "spelling",
      "phonetic_spelling"
    ]
  },
  {
    "id": "q_018",
    "question_number": 18,
    "difficulty": "beginner",
    "difficulty_score": 1,
    "topic": "Writing & Spelling",
    "sub_topic": "Word Tracing",
    "ld_trigger": "dysgraphia",
    "clinical_metric": "Word_Tracing",
    "question_type": "trace",
    "question_text": "Trace the word 'dog'",
    "options": [
      "Word outline"
    ],
    "correct_answer": "dog",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "fine_motor",
      "word_formation"
    ]
  },
  {
    "id": "q_019",
    "question_number": 19,
    "difficulty": "beginner",
    "difficulty_score": 1,
    "topic": "Writing & Spelling",
    "sub_topic": "Letter-Sound Connection",
    "ld_trigger": "dysgraphia",
    "clinical_metric": "Letter_Sound",
    "question_type": "mcq",
    "question_text": "Which letter makes the 'mmm' sound?",
    "options": [
      "M",
      "B",
      "S"
    ],
    "correct_answer": "M",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "phonics",
      "letter_sound"
    ]
  },
  {
    "id": "q_020",
    "question_number": 20,
    "difficulty": "beginner",
    "difficulty_score": 1,
    "topic": "Visual-Spatial",
    "sub_topic": "Shape Recognition",
    "ld_trigger": "dysgraphia",
    "clinical_metric": "Shape_ID",
    "question_type": "mcq",
    "question_text": "Which is a circle?",
    "options": [
      "Square",
      "Circle",
      "Triangle"
    ],
    "correct_answer": "Circle",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": true,
    "tags": [
      "shapes",
      "visual_recognition"
    ]
  },
  {
    "id": "q_021",
    "question_number": 21,
    "difficulty": "beginner",
    "difficulty_score": 1,
    "topic": "Visual-Spatial",
    "sub_topic": "Color Identification",
    "ld_trigger": "dysgraphia",
    "clinical_metric": "Color_ID",
    "question_type": "mcq",
    "question_text": "Which is red?",
    "options": [
      "Blue",
      "Red",
      "Green"
    ],
    "correct_answer": "Red",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": true,
    "tags": [
      "colors",
      "visual_discrimination"
    ]
  },
  {
    "id": "q_022",
    "question_number": 22,
    "difficulty": "beginner",
    "difficulty_score": 1,
    "topic": "Visual-Spatial",
    "sub_topic": "Size Matching",
    "ld_trigger": "dysgraphia",
    "clinical_metric": "Size_Comparison",
    "question_type": "audio_image_tap",
    "question_text": "Tap the big one",
    "options": [
      "Small Square",
      "Big Square",
      "Medium Square"
    ],
    "correct_answer": "Big Square",
    "requires_audio": true,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": true,
    "tags": [
      "size_discrimination",
      "comparison"
    ]
  },
  {
    "id": "q_023",
    "question_number": 23,
    "difficulty": "beginner",
    "difficulty_score": 1,
    "topic": "Visual-Spatial",
    "sub_topic": "Pattern Recognition",
    "ld_trigger": "dysgraphia",
    "clinical_metric": "Pattern_ID",
    "question_type": "mcq",
    "question_text": "Which continues the pattern? (Red, Blue, Red, __)",
    "options": [
      "Blue",
      "Red",
      "Green"
    ],
    "correct_answer": "Blue",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": true,
    "tags": [
      "patterns",
      "visual_reasoning"
    ]
  },
  {
    "id": "q_024",
    "question_number": 24,
    "difficulty": "beginner",
    "difficulty_score": 1,
    "topic": "Visual-Spatial",
    "sub_topic": "Puzzle Piece Matching",
    "ld_trigger": "dysgraphia",
    "clinical_metric": "Spatial_Matching",
    "question_type": "drag_order",
    "question_text": "Arrange puzzle pieces in correct order",
    "options": [
      "Piece A",
      "Piece B",
      "Piece C"
    ],
    "correct_answer": "Piece A | Piece B | Piece C",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": true,
    "tags": [
      "spatial_reasoning",
      "assembly"
    ]
  },
  {
    "id": "q_025",
    "question_number": 25,
    "difficulty": "beginner",
    "difficulty_score": 1,
    "topic": "Visual-Spatial",
    "sub_topic": "Position Understanding",
    "ld_trigger": "dysgraphia",
    "clinical_metric": "Spatial_Position",
    "question_type": "mcq",
    "question_text": "Which is on top?",
    "options": [
      "Circle on bottom",
      "Circle on top",
      "Circle in middle"
    ],
    "correct_answer": "Circle on top",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": true,
    "tags": [
      "spatial_position",
      "direction"
    ]
  },
  {
    "id": "q_026",
    "question_number": 26,
    "difficulty": "beginner",
    "difficulty_score": 1,
    "topic": "Math & Number Sense",
    "sub_topic": "Number Recognition",
    "ld_trigger": "dyscalculia",
    "clinical_metric": "Number_ID",
    "question_type": "audio_image_tap",
    "question_text": "Tap the number 5",
    "options": [
      "3",
      "5",
      "7"
    ],
    "correct_answer": "5",
    "requires_audio": true,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": true,
    "tags": [
      "number_recognition",
      "counting"
    ]
  },
  {
    "id": "q_027",
    "question_number": 27,
    "difficulty": "beginner",
    "difficulty_score": 1,
    "topic": "Math & Number Sense",
    "sub_topic": "Counting",
    "ld_trigger": "dyscalculia",
    "clinical_metric": "Counting_Sequence",
    "question_type": "mcq",
    "question_text": "Count the dots: ●●●",
    "options": [
      "2",
      "3",
      "4"
    ],
    "correct_answer": "3",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": true,
    "tags": [
      "counting",
      "number_sense"
    ]
  },
  {
    "id": "q_028",
    "question_number": 28,
    "difficulty": "beginner",
    "difficulty_score": 1,
    "topic": "Math & Number Sense",
    "sub_topic": "Number Comparison",
    "ld_trigger": "dyscalculia",
    "clinical_metric": "Number_Comparison",
    "question_type": "mcq",
    "question_text": "Which is bigger? 3 or 7",
    "options": [
      "3",
      "7"
    ],
    "correct_answer": "7",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "comparison",
      "greater_less"
    ]
  },
  {
    "id": "q_029",
    "question_number": 29,
    "difficulty": "beginner",
    "difficulty_score": 1,
    "topic": "Math & Number Sense",
    "sub_topic": "Simple Addition",
    "ld_trigger": "dyscalculia",
    "clinical_metric": "Basic_Addition",
    "question_type": "mcq",
    "question_text": "1 + 1 = ?",
    "options": [
      "1",
      "2",
      "3"
    ],
    "correct_answer": "2",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "addition",
      "arithmetic"
    ]
  },
  {
    "id": "q_030",
    "question_number": 30,
    "difficulty": "beginner",
    "difficulty_score": 1,
    "topic": "Math & Number Sense",
    "sub_topic": "Quantity Matching",
    "ld_trigger": "dyscalculia",
    "clinical_metric": "Quantity_Match",
    "question_type": "audio_image_tap",
    "question_text": "Tap the group with 4 items",
    "options": [
      "2 items",
      "4 items",
      "6 items"
    ],
    "correct_answer": "4 items",
    "requires_audio": true,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": true,
    "tags": [
      "quantity",
      "cardinality"
    ]
  },
  {
    "id": "q_031",
    "question_number": 31,
    "difficulty": "beginner",
    "difficulty_score": 1,
    "topic": "Math & Number Sense",
    "sub_topic": "Simple Subtraction",
    "ld_trigger": "dyscalculia",
    "clinical_metric": "Basic_Subtraction",
    "question_type": "mcq",
    "question_text": "3 - 1 = ?",
    "options": [
      "1",
      "2",
      "3"
    ],
    "correct_answer": "2",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "subtraction",
      "arithmetic"
    ]
  },
  {
    "id": "q_032",
    "question_number": 32,
    "difficulty": "beginner",
    "difficulty_score": 1,
    "topic": "Math & Number Sense",
    "sub_topic": "Number Sequence",
    "ld_trigger": "dyscalculia",
    "clinical_metric": "Number_Sequence",
    "question_type": "mcq",
    "question_text": "What comes after 4? (4, 5, __)",
    "options": [
      "5",
      "6",
      "7"
    ],
    "correct_answer": "6",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "sequencing",
      "number_order"
    ]
  },
  {
    "id": "q_033",
    "question_number": 33,
    "difficulty": "beginner",
    "difficulty_score": 1,
    "topic": "Listening & Audio",
    "sub_topic": "Sound Recognition",
    "ld_trigger": "mixed",
    "clinical_metric": "Sound_Discrimination",
    "question_type": "audio_image_tap",
    "question_text": "Listen and tap: Which sound is louder?",
    "options": [
      "Quiet sound",
      "Loud sound"
    ],
    "correct_answer": "Loud sound",
    "requires_audio": true,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "listening",
      "volume_discrimination"
    ]
  },
  {
    "id": "q_034",
    "question_number": 34,
    "difficulty": "beginner",
    "difficulty_score": 1,
    "topic": "Listening & Audio",
    "sub_topic": "Direction Following",
    "ld_trigger": "mixed",
    "clinical_metric": "Instruction_Following",
    "question_type": "audio_image_tap",
    "question_text": "Follow the instruction: Tap the red circle",
    "options": [
      "Red circle",
      "Blue square"
    ],
    "correct_answer": "Red circle",
    "requires_audio": true,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": true,
    "tags": [
      "listening",
      "comprehension"
    ]
  },
  {
    "id": "q_035",
    "question_number": 35,
    "difficulty": "beginner",
    "difficulty_score": 1,
    "topic": "Listening & Audio",
    "sub_topic": "Environmental Sounds",
    "ld_trigger": "mixed",
    "clinical_metric": "Env_Sound_ID",
    "question_type": "audio_image_tap",
    "question_text": "What sound is this? (Rain sound)",
    "options": [
      "Rain",
      "Thunder",
      "Wind"
    ],
    "correct_answer": "Rain",
    "requires_audio": true,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": true,
    "tags": [
      "listening",
      "sound_identification"
    ]
  },
  {
    "id": "q_036",
    "question_number": 36,
    "difficulty": "intermediate",
    "difficulty_score": 2,
    "topic": "Phonics & Sound",
    "sub_topic": "Digraph Recognition",
    "ld_trigger": "dyslexia",
    "clinical_metric": "Digraph_ID",
    "question_type": "mcq",
    "question_text": "Which words have 'ch' sound?",
    "options": [
      "chair",
      "apple",
      "church"
    ],
    "correct_answer": "chair, church",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "digraphs",
      "phonemic_awareness"
    ]
  },
  {
    "id": "q_037",
    "question_number": 37,
    "difficulty": "intermediate",
    "difficulty_score": 2,
    "topic": "Phonics & Sound",
    "sub_topic": "Blending Syllables",
    "ld_trigger": "dyslexia",
    "clinical_metric": "Syllable_Blending",
    "question_type": "audio_image_tap",
    "question_text": "Listen and blend: 'sun' + 'shine'",
    "options": [
      "sunshine",
      "sunburn",
      "sunlight"
    ],
    "correct_answer": "sunshine",
    "requires_audio": true,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "syllables",
      "word_building"
    ]
  },
  {
    "id": "q_038",
    "question_number": 38,
    "difficulty": "intermediate",
    "difficulty_score": 2,
    "topic": "Phonics & Sound",
    "sub_topic": "Word Families",
    "ld_trigger": "dyslexia",
    "clinical_metric": "Word_Families",
    "question_type": "mcq",
    "question_text": "Which rhymes with 'make'?",
    "options": [
      "cake",
      "dog",
      "fish"
    ],
    "correct_answer": "cake",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "rhyming",
      "word_families"
    ]
  },
  {
    "id": "q_039",
    "question_number": 39,
    "difficulty": "intermediate",
    "difficulty_score": 2,
    "topic": "Phonics & Sound",
    "sub_topic": "Long vs Short Vowels",
    "ld_trigger": "dyslexia",
    "clinical_metric": "Vowel_Length",
    "question_type": "mcq",
    "question_text": "Long 'a' sound: (a, ay, ai)",
    "options": [
      "cat",
      "cake",
      "man"
    ],
    "correct_answer": "cake",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "vowels",
      "phonics_rules"
    ]
  },
  {
    "id": "q_040",
    "question_number": 40,
    "difficulty": "intermediate",
    "difficulty_score": 2,
    "topic": "Phonics & Sound",
    "sub_topic": "Consonant Blends",
    "ld_trigger": "dyslexia",
    "clinical_metric": "Consonant_Blends",
    "question_type": "mcq",
    "question_text": "Which has the 'st' blend?",
    "options": [
      "stop",
      "apple",
      "dog"
    ],
    "correct_answer": "stop",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "blends",
      "phonics"
    ]
  },
  {
    "id": "q_041",
    "question_number": 41,
    "difficulty": "intermediate",
    "difficulty_score": 2,
    "topic": "Reading & Comprehension",
    "sub_topic": "Reading Passage",
    "ld_trigger": "dyslexia",
    "clinical_metric": "Passage_Comprehension",
    "question_type": "read_select",
    "question_text": "Read: 'The cat sat on the mat.' Where did the cat sit?",
    "options": [
      "on the mat",
      "in the tree",
      "in the house"
    ],
    "correct_answer": "on the mat",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "comprehension",
      "detail_recall"
    ]
  },
  {
    "id": "q_042",
    "question_number": 42,
    "difficulty": "intermediate",
    "difficulty_score": 2,
    "topic": "Reading & Comprehension",
    "sub_topic": "Inference",
    "ld_trigger": "dyslexia",
    "clinical_metric": "Inference",
    "question_type": "read_select",
    "question_text": "Story: 'It was raining. Tim carried an umbrella.' Why did Tim carry an umbrella?",
    "options": [
      "It was raining",
      "He liked it",
      "He was cold"
    ],
    "correct_answer": "It was raining",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "inference",
      "reading_comprehension"
    ]
  },
  {
    "id": "q_043",
    "question_number": 43,
    "difficulty": "intermediate",
    "difficulty_score": 2,
    "topic": "Reading & Comprehension",
    "sub_topic": "Vocabulary in Context",
    "ld_trigger": "dyslexia",
    "clinical_metric": "Vocabulary_Context",
    "question_type": "mcq",
    "question_text": "In 'She was happy', happy means:",
    "options": [
      "sad",
      "glad",
      "tired"
    ],
    "correct_answer": "glad",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "vocabulary",
      "context_clues"
    ]
  },
  {
    "id": "q_044",
    "question_number": 44,
    "difficulty": "intermediate",
    "difficulty_score": 2,
    "topic": "Reading & Comprehension",
    "sub_topic": "Question Answering",
    "ld_trigger": "dyslexia",
    "clinical_metric": "Question_Answer",
    "question_type": "read_select",
    "question_text": "Read: 'Birds can fly.' Can birds fly?",
    "options": [
      "Yes",
      "No"
    ],
    "correct_answer": "Yes",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "comprehension",
      "factual_recall"
    ]
  },
  {
    "id": "q_045",
    "question_number": 45,
    "difficulty": "intermediate",
    "difficulty_score": 2,
    "topic": "Reading & Comprehension",
    "sub_topic": "Story Order",
    "ld_trigger": "dyslexia",
    "clinical_metric": "Story_Sequencing",
    "question_type": "drag_order",
    "question_text": "Arrange in order: went to school, woke up, ate breakfast",
    "options": [
      "woke up",
      "ate breakfast",
      "went to school"
    ],
    "correct_answer": "woke up, ate breakfast, went to school",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "sequencing",
      "narrative_order"
    ]
  },
  {
    "id": "q_046",
    "question_number": 46,
    "difficulty": "intermediate",
    "difficulty_score": 2,
    "topic": "Reading & Comprehension",
    "sub_topic": "Character Identification",
    "ld_trigger": "dyslexia",
    "clinical_metric": "Character_ID",
    "question_type": "read_select",
    "question_text": "Story: 'John and Sarah went to the park.' Who went to the park?",
    "options": [
      "John",
      "Sarah",
      "John and Sarah"
    ],
    "correct_answer": "John and Sarah",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "comprehension",
      "character_tracking"
    ]
  },
  {
    "id": "q_047",
    "question_number": 47,
    "difficulty": "intermediate",
    "difficulty_score": 2,
    "topic": "Reading & Comprehension",
    "sub_topic": "Main Idea",
    "ld_trigger": "dyslexia",
    "clinical_metric": "Main_Idea",
    "question_type": "read_select",
    "question_text": "Story about animals in a zoo. Main idea is:",
    "options": [
      "The zoo has animals",
      "The zoo is big",
      "The zoo is closed"
    ],
    "correct_answer": "The zoo has animals",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "main_idea",
      "comprehension"
    ]
  },
  {
    "id": "q_048",
    "question_number": 48,
    "difficulty": "intermediate",
    "difficulty_score": 2,
    "topic": "Reading & Comprehension",
    "sub_topic": "Word Definition",
    "ld_trigger": "dyslexia",
    "clinical_metric": "Word_Definition",
    "question_type": "mcq",
    "question_text": "What does 'friend' mean?",
    "options": [
      "someone you like",
      "a toy",
      "an animal"
    ],
    "correct_answer": "someone you like",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "vocabulary",
      "definitions"
    ]
  },
  {
    "id": "q_049",
    "question_number": 49,
    "difficulty": "intermediate",
    "difficulty_score": 2,
    "topic": "Writing & Spelling",
    "sub_topic": "CVC Word Spelling",
    "ld_trigger": "dysgraphia",
    "clinical_metric": "CVC_Spelling",
    "question_type": "fill_blank",
    "question_text": "Spell the word shown in picture (run)",
    "options": [
      "r_n"
    ],
    "correct_answer": "run",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": true,
    "requires_image": true,
    "tags": [
      "spelling",
      "phonetic_spelling"
    ]
  },
  {
    "id": "q_050",
    "question_number": 50,
    "difficulty": "intermediate",
    "difficulty_score": 2,
    "topic": "Writing & Spelling",
    "sub_topic": "Word Completion",
    "ld_trigger": "dysgraphia",
    "clinical_metric": "Word_Completion",
    "question_type": "fill_blank",
    "question_text": "Complete: 'The cat is on the m___'",
    "options": [
      "mat",
      "mat"
    ],
    "correct_answer": "mat",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": true,
    "requires_image": false,
    "tags": [
      "spelling",
      "sentence_writing"
    ]
  },
  {
    "id": "q_051",
    "question_number": 51,
    "difficulty": "intermediate",
    "difficulty_score": 2,
    "topic": "Writing & Spelling",
    "sub_topic": "Sentence Writing",
    "ld_trigger": "dysgraphia",
    "clinical_metric": "Sentence_Writing",
    "question_type": "read_complete",
    "question_text": "Complete the sentence: 'I like to ___'",
    "options": [
      "Various answers"
    ],
    "correct_answer": "play/read/eat/etc",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": true,
    "requires_image": false,
    "tags": [
      "writing",
      "sentence_formation"
    ]
  },
  {
    "id": "q_052",
    "question_number": 52,
    "difficulty": "intermediate",
    "difficulty_score": 2,
    "topic": "Writing & Spelling",
    "sub_topic": "Capitalization",
    "ld_trigger": "dysgraphia",
    "clinical_metric": "Capitalization",
    "question_type": "fill_blank",
    "question_text": "Fix: 'john likes pizza' (capitalize first name)",
    "options": [
      "John",
      "john"
    ],
    "correct_answer": "John",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": true,
    "requires_image": false,
    "tags": [
      "capitalization",
      "grammar"
    ]
  },
  {
    "id": "q_053",
    "question_number": 53,
    "difficulty": "intermediate",
    "difficulty_score": 2,
    "topic": "Writing & Spelling",
    "sub_topic": "Punctuation",
    "ld_trigger": "dysgraphia",
    "clinical_metric": "Punctuation",
    "question_type": "mcq",
    "question_text": "Which has correct punctuation?",
    "options": [
      "Where are you",
      "Where are you?",
      "where are you"
    ],
    "correct_answer": "Where are you?",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "punctuation",
      "grammar"
    ]
  },
  {
    "id": "q_054",
    "question_number": 54,
    "difficulty": "intermediate",
    "difficulty_score": 2,
    "topic": "Writing & Spelling",
    "sub_topic": "Letter Writing",
    "ld_trigger": "dysgraphia",
    "clinical_metric": "Letter_Writing",
    "question_type": "read_complete",
    "question_text": "Write a greeting: 'Dear ___'",
    "options": [
      "Name to write"
    ],
    "correct_answer": "Mom/Friend/Name",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": true,
    "requires_image": false,
    "tags": [
      "letter_writing",
      "conventions"
    ]
  },
  {
    "id": "q_055",
    "question_number": 55,
    "difficulty": "intermediate",
    "difficulty_score": 2,
    "topic": "Visual-Spatial",
    "sub_topic": "Complex Patterns",
    "ld_trigger": "dysgraphia",
    "clinical_metric": "Pattern_Completion",
    "question_type": "mcq",
    "question_text": "Complete pattern: Red, Blue, Red, Blue, ___",
    "options": [
      "Red",
      "Blue",
      "Green"
    ],
    "correct_answer": "Red",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": true,
    "tags": [
      "patterns",
      "visual_reasoning"
    ]
  },
  {
    "id": "q_056",
    "question_number": 56,
    "difficulty": "intermediate",
    "difficulty_score": 2,
    "topic": "Visual-Spatial",
    "sub_topic": "Spatial Relationships",
    "ld_trigger": "dysgraphia",
    "clinical_metric": "Spatial_Relations",
    "question_type": "mcq",
    "question_text": "Which shape is inside the circle?",
    "options": [
      "Triangle inside",
      "Square outside",
      "Circle around"
    ],
    "correct_answer": "Triangle inside",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": true,
    "tags": [
      "spatial_reasoning",
      "prepositions"
    ]
  },
  {
    "id": "q_057",
    "question_number": 57,
    "difficulty": "intermediate",
    "difficulty_score": 2,
    "topic": "Visual-Spatial",
    "sub_topic": "Picture Differences",
    "ld_trigger": "dysgraphia",
    "clinical_metric": "Picture_Comparison",
    "question_type": "read_select",
    "question_text": "Find 2 differences between pictures",
    "options": [
      "Picture A",
      "Picture B"
    ],
    "correct_answer": "Differences marked",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": true,
    "tags": [
      "visual_discrimination",
      "detail_recognition"
    ]
  },
  {
    "id": "q_058",
    "question_number": 58,
    "difficulty": "intermediate",
    "difficulty_score": 2,
    "topic": "Visual-Spatial",
    "sub_topic": "Rotation & Symmetry",
    "ld_trigger": "dysgraphia",
    "clinical_metric": "Symmetry_Rotation",
    "question_type": "mcq",
    "question_text": "Which is a mirror image?",
    "options": [
      "Mirror Image",
      "Non-Mirror",
      "Rotated"
    ],
    "correct_answer": "Mirror Image",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": true,
    "tags": [
      "symmetry",
      "spatial_reasoning"
    ]
  },
  {
    "id": "q_059",
    "question_number": 59,
    "difficulty": "intermediate",
    "difficulty_score": 2,
    "topic": "Visual-Spatial",
    "sub_topic": "Maze Navigation",
    "ld_trigger": "dysgraphia",
    "clinical_metric": "Spatial_Navigation",
    "question_type": "trace",
    "question_text": "Trace the path from start to end",
    "options": [
      "Maze outline"
    ],
    "correct_answer": "Correct path",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "spatial_planning",
      "motor_control"
    ]
  },
  {
    "id": "q_060",
    "question_number": 60,
    "difficulty": "intermediate",
    "difficulty_score": 2,
    "topic": "Math & Number Sense",
    "sub_topic": "Two-Digit Addition",
    "ld_trigger": "dyscalculia",
    "clinical_metric": "Two_Digit_Addition",
    "question_type": "mcq",
    "question_text": "12 + 5 = ?",
    "options": [
      "15",
      "17",
      "18"
    ],
    "correct_answer": "17",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "addition",
      "arithmetic"
    ]
  },
  {
    "id": "q_061",
    "question_number": 61,
    "difficulty": "intermediate",
    "difficulty_score": 2,
    "topic": "Math & Number Sense",
    "sub_topic": "Two-Digit Subtraction",
    "ld_trigger": "dyscalculia",
    "clinical_metric": "Two_Digit_Subtraction",
    "question_type": "mcq",
    "question_text": "15 - 3 = ?",
    "options": [
      "10",
      "12",
      "18"
    ],
    "correct_answer": "12",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "subtraction",
      "arithmetic"
    ]
  },
  {
    "id": "q_062",
    "question_number": 62,
    "difficulty": "intermediate",
    "difficulty_score": 2,
    "topic": "Math & Number Sense",
    "sub_topic": "Skip Counting",
    "ld_trigger": "dyscalculia",
    "clinical_metric": "Skip_Counting",
    "question_type": "mcq",
    "question_text": "Count by 5s: 5, 10, 15, __",
    "options": [
      "18",
      "20",
      "25"
    ],
    "correct_answer": "20",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "skip_counting",
      "multiples"
    ]
  },
  {
    "id": "q_063",
    "question_number": 63,
    "difficulty": "intermediate",
    "difficulty_score": 2,
    "topic": "Math & Number Sense",
    "sub_topic": "Word Problem",
    "ld_trigger": "dyscalculia",
    "clinical_metric": "Word_Problem",
    "question_type": "read_select",
    "question_text": "Tom has 3 apples. Mom gives 2 more. How many total?",
    "options": [
      "4",
      "5",
      "6"
    ],
    "correct_answer": "5",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "word_problems",
      "arithmetic"
    ]
  },
  {
    "id": "q_064",
    "question_number": 64,
    "difficulty": "intermediate",
    "difficulty_score": 2,
    "topic": "Math & Number Sense",
    "sub_topic": "Even/Odd Numbers",
    "ld_trigger": "dyscalculia",
    "clinical_metric": "Even_Odd",
    "question_type": "mcq",
    "question_text": "Which is even?",
    "options": [
      "3",
      "4",
      "5"
    ],
    "correct_answer": "4",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "even_odd",
      "number_classification"
    ]
  },
  {
    "id": "q_065",
    "question_number": 65,
    "difficulty": "intermediate",
    "difficulty_score": 2,
    "topic": "Math & Number Sense",
    "sub_topic": "Place Value",
    "ld_trigger": "dyscalculia",
    "clinical_metric": "Place_Value",
    "question_type": "mcq",
    "question_text": "In 24, what is the tens digit?",
    "options": [
      "2",
      "4"
    ],
    "correct_answer": "2",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "place_value",
      "number_sense"
    ]
  },
  {
    "id": "q_066",
    "question_number": 66,
    "difficulty": "intermediate",
    "difficulty_score": 2,
    "topic": "Math & Number Sense",
    "sub_topic": "Money Recognition",
    "ld_trigger": "dyscalculia",
    "clinical_metric": "Money_ID",
    "question_type": "mcq",
    "question_text": "Which coin is worth more?",
    "options": [
      "Penny",
      "Nickel",
      "Dime"
    ],
    "correct_answer": "Dime",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": true,
    "tags": [
      "money",
      "value"
    ]
  },
  {
    "id": "q_067",
    "question_number": 67,
    "difficulty": "intermediate",
    "difficulty_score": 2,
    "topic": "Listening & Audio",
    "sub_topic": "Listening Comprehension",
    "ld_trigger": "mixed",
    "clinical_metric": "Listen_Comprehension",
    "question_type": "scenario",
    "question_text": "Listen to story: 'A boy went to the store.' Where did he go?",
    "options": [
      "store",
      "park",
      "school"
    ],
    "correct_answer": "store",
    "requires_audio": true,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "listening",
      "comprehension"
    ]
  },
  {
    "id": "q_068",
    "question_number": 68,
    "difficulty": "intermediate",
    "difficulty_score": 2,
    "topic": "Listening & Audio",
    "sub_topic": "Following Directions",
    "ld_trigger": "mixed",
    "clinical_metric": "Multi_Step_Directions",
    "question_type": "scenario",
    "question_text": "Listen: 'Pick up the red ball, then put it in the box.'",
    "options": [
      "Complete task",
      "Not complete"
    ],
    "correct_answer": "Complete task",
    "requires_audio": true,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": true,
    "tags": [
      "listening",
      "instruction_following"
    ]
  },
  {
    "id": "q_069",
    "question_number": 69,
    "difficulty": "intermediate",
    "difficulty_score": 2,
    "topic": "Listening & Audio",
    "sub_topic": "Auditory Discrimination",
    "ld_trigger": "mixed",
    "clinical_metric": "Sound_Discrimination",
    "question_type": "audio_image_tap",
    "question_text": "Are these words the same or different? (bat, bat)",
    "options": [
      "Same",
      "Different"
    ],
    "correct_answer": "Same",
    "requires_audio": true,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "phonemic_awareness",
      "discrimination"
    ]
  },
  {
    "id": "q_070",
    "question_number": 70,
    "difficulty": "intermediate",
    "difficulty_score": 2,
    "topic": "Listening & Audio",
    "sub_topic": "Story Recall",
    "ld_trigger": "mixed",
    "clinical_metric": "Story_Recall",
    "question_type": "scenario",
    "question_text": "Listen to story, then recall: What was the main character doing?",
    "options": [
      "Answer from story"
    ],
    "correct_answer": "Correct recall",
    "requires_audio": true,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "listening",
      "memory",
      "comprehension"
    ]
  },
  {
    "id": "q_071",
    "question_number": 71,
    "difficulty": "advanced",
    "difficulty_score": 3,
    "topic": "Phonics & Sound",
    "sub_topic": "Multi-Syllable Words",
    "ld_trigger": "dyslexia",
    "clinical_metric": "Multisyllabic_Words",
    "question_type": "mcq",
    "question_text": "How many syllables in 'butterfly'?",
    "options": [
      "2",
      "3",
      "4"
    ],
    "correct_answer": "3",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "syllables",
      "phoneme_segmentation"
    ]
  },
  {
    "id": "q_072",
    "question_number": 72,
    "difficulty": "advanced",
    "difficulty_score": 3,
    "topic": "Phonics & Sound",
    "sub_topic": "Silent Letters",
    "ld_trigger": "dyslexia",
    "clinical_metric": "Silent_Letters",
    "question_type": "mcq",
    "question_text": "Which word has a silent letter?",
    "options": [
      "knife",
      "car",
      "dog"
    ],
    "correct_answer": "knife",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "phonics",
      "phonetic_rules"
    ]
  },
  {
    "id": "q_073",
    "question_number": 73,
    "difficulty": "advanced",
    "difficulty_score": 3,
    "topic": "Phonics & Sound",
    "sub_topic": "Prefix/Suffix",
    "ld_trigger": "dyslexia",
    "clinical_metric": "Morphology",
    "question_type": "mcq",
    "question_text": "What does 'un' in 'unhappy' mean?",
    "options": [
      "not",
      "very",
      "kind"
    ],
    "correct_answer": "not",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "morphology",
      "word_parts"
    ]
  },
  {
    "id": "q_074",
    "question_number": 74,
    "difficulty": "advanced",
    "difficulty_score": 3,
    "topic": "Reading & Comprehension",
    "sub_topic": "Complex Passage",
    "ld_trigger": "dyslexia",
    "clinical_metric": "Passage_Comprehension",
    "question_type": "read_select",
    "question_text": "Read paragraph about seasons. What causes seasons to change?",
    "options": [
      "Earth's tilt",
      "Distance from sun",
      "Moon"
    ],
    "correct_answer": "Earth's tilt",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "comprehension",
      "inference"
    ]
  },
  {
    "id": "q_075",
    "question_number": 75,
    "difficulty": "advanced",
    "difficulty_score": 3,
    "topic": "Reading & Comprehension",
    "sub_topic": "Author's Purpose",
    "ld_trigger": "dyslexia",
    "clinical_metric": "Author_Purpose",
    "question_type": "read_select",
    "question_text": "Why did the author write this? (Story provided)",
    "options": [
      "To entertain",
      "To inform",
      "To persuade"
    ],
    "correct_answer": "To entertain",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "author_purpose",
      "critical_reading"
    ]
  },
  {
    "id": "q_076",
    "question_number": 76,
    "difficulty": "advanced",
    "difficulty_score": 3,
    "topic": "Reading & Comprehension",
    "sub_topic": "Fact vs Opinion",
    "ld_trigger": "dyslexia",
    "clinical_metric": "Fact_Opinion",
    "question_type": "read_select",
    "question_text": "Which is a fact? (facts and opinions provided)",
    "options": [
      "Factual statement",
      "Opinion statement"
    ],
    "correct_answer": "Factual statement",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "critical_reading",
      "analysis"
    ]
  },
  {
    "id": "q_077",
    "question_number": 77,
    "difficulty": "advanced",
    "difficulty_score": 3,
    "topic": "Reading & Comprehension",
    "sub_topic": "Cause and Effect",
    "ld_trigger": "dyslexia",
    "clinical_metric": "Cause_Effect",
    "question_type": "read_select",
    "question_text": "What happened because of the heavy rain?",
    "options": [
      "Answer choices about effects"
    ],
    "correct_answer": "Correct effect",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "cause_effect",
      "comprehension"
    ]
  },
  {
    "id": "q_078",
    "question_number": 78,
    "difficulty": "advanced",
    "difficulty_score": 3,
    "topic": "Reading & Comprehension",
    "sub_topic": "Theme Identification",
    "ld_trigger": "dyslexia",
    "clinical_metric": "Theme_ID",
    "question_type": "read_select",
    "question_text": "What is the theme of the story? (Story provided)",
    "options": [
      "Theme options"
    ],
    "correct_answer": "Correct theme",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "theme",
      "literary_analysis"
    ]
  },
  {
    "id": "q_079",
    "question_number": 79,
    "difficulty": "advanced",
    "difficulty_score": 3,
    "topic": "Reading & Comprehension",
    "sub_topic": "Context Clues",
    "ld_trigger": "dyslexia",
    "clinical_metric": "Context_Clues",
    "question_type": "read_select",
    "question_text": "The 'benevolent' person helped everyone. Benevolent means:",
    "options": [
      "kind",
      "mean",
      "sad"
    ],
    "correct_answer": "kind",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "vocabulary",
      "inference"
    ]
  },
  {
    "id": "q_080",
    "question_number": 80,
    "difficulty": "advanced",
    "difficulty_score": 3,
    "topic": "Writing & Spelling",
    "sub_topic": "Paragraph Writing",
    "ld_trigger": "dysgraphia",
    "clinical_metric": "Paragraph_Writing",
    "question_type": "writing_sample",
    "question_text": "Write a paragraph about your favorite place",
    "options": [
      "Paragraph provided"
    ],
    "correct_answer": "Complete paragraph",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": true,
    "requires_image": false,
    "tags": [
      "writing",
      "organization"
    ]
  },
  {
    "id": "q_081",
    "question_number": 81,
    "difficulty": "advanced",
    "difficulty_score": 3,
    "topic": "Writing & Spelling",
    "sub_topic": "Story Writing",
    "ld_trigger": "dysgraphia",
    "clinical_metric": "Story_Writing",
    "question_type": "writing_sample",
    "question_text": "Write a short story with beginning, middle, end",
    "options": [
      "Story outline"
    ],
    "correct_answer": "Complete story",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": true,
    "requires_image": false,
    "tags": [
      "narrative_writing",
      "structure"
    ]
  },
  {
    "id": "q_082",
    "question_number": 82,
    "difficulty": "advanced",
    "difficulty_score": 3,
    "topic": "Writing & Spelling",
    "sub_topic": "Complex Spelling",
    "ld_trigger": "dysgraphia",
    "clinical_metric": "Advanced_Spelling",
    "question_type": "fill_blank",
    "question_text": "Spell: 'necessary', 'accommodate'",
    "options": [
      "Words to spell"
    ],
    "correct_answer": "Correct spelling",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": true,
    "requires_image": false,
    "tags": [
      "spelling",
      "orthography"
    ]
  },
  {
    "id": "q_083",
    "question_number": 83,
    "difficulty": "advanced",
    "difficulty_score": 3,
    "topic": "Writing & Spelling",
    "sub_topic": "Grammar Rules",
    "ld_trigger": "dysgraphia",
    "clinical_metric": "Advanced_Grammar",
    "question_type": "read_complete",
    "question_text": "Complete with correct verb: 'She ___ (go/goes) to school.'",
    "options": [
      "go",
      "goes"
    ],
    "correct_answer": "goes",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": true,
    "requires_image": false,
    "tags": [
      "grammar",
      "verb_agreement"
    ]
  },
  {
    "id": "q_084",
    "question_number": 84,
    "difficulty": "advanced",
    "difficulty_score": 3,
    "topic": "Writing & Spelling",
    "sub_topic": "Editing & Revision",
    "ld_trigger": "dysgraphia",
    "clinical_metric": "Editing",
    "question_type": "read_complete",
    "question_text": "Edit for errors: 'I seen the movie yesterday.'",
    "options": [
      "Corrected",
      "Original"
    ],
    "correct_answer": "I saw the movie yesterday.",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": true,
    "requires_image": false,
    "tags": [
      "editing",
      "proofreading"
    ]
  },
  {
    "id": "q_085",
    "question_number": 85,
    "difficulty": "advanced",
    "difficulty_score": 3,
    "topic": "Visual-Spatial",
    "sub_topic": "3D Visualization",
    "ld_trigger": "dysgraphia",
    "clinical_metric": "3D_Spatial_Reasoning",
    "question_type": "mcq",
    "question_text": "If you rotate this cube, which face is opposite?",
    "options": [
      "Face A",
      "Face B",
      "Face C"
    ],
    "correct_answer": "Face C",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": true,
    "tags": [
      "3d_reasoning",
      "spatial"
    ]
  },
  {
    "id": "q_086",
    "question_number": 86,
    "difficulty": "advanced",
    "difficulty_score": 3,
    "topic": "Visual-Spatial",
    "sub_topic": "Map Navigation",
    "ld_trigger": "dysgraphia",
    "clinical_metric": "Map_Reading",
    "question_type": "read_select",
    "question_text": "Looking at map, which direction is north from school?",
    "options": [
      "North",
      "South",
      "East"
    ],
    "correct_answer": "North",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": true,
    "tags": [
      "map_reading",
      "spatial_reasoning"
    ]
  },
  {
    "id": "q_087",
    "question_number": 87,
    "difficulty": "advanced",
    "difficulty_score": 3,
    "topic": "Visual-Spatial",
    "sub_topic": "Geometric Reasoning",
    "ld_trigger": "dysgraphia",
    "clinical_metric": "Geometry",
    "question_type": "mcq",
    "question_text": "How many vertices does a triangle have?",
    "options": [
      "2",
      "3",
      "4"
    ],
    "correct_answer": "3",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "geometry",
      "spatial_reasoning"
    ]
  },
  {
    "id": "q_088",
    "question_number": 88,
    "difficulty": "advanced",
    "difficulty_score": 3,
    "topic": "Math & Number Sense",
    "sub_topic": "Multi-Digit Operations",
    "ld_trigger": "dyscalculia",
    "clinical_metric": "Multi_Digit_Math",
    "question_type": "mcq",
    "question_text": "25 × 3 = ?",
    "options": [
      "65",
      "75",
      "85"
    ],
    "correct_answer": "75",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "multiplication",
      "arithmetic"
    ]
  },
  {
    "id": "q_089",
    "question_number": 89,
    "difficulty": "advanced",
    "difficulty_score": 3,
    "topic": "Math & Number Sense",
    "sub_topic": "Division",
    "ld_trigger": "dyscalculia",
    "clinical_metric": "Division",
    "question_type": "mcq",
    "question_text": "20 ÷ 4 = ?",
    "options": [
      "4",
      "5",
      "6"
    ],
    "correct_answer": "5",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "division",
      "arithmetic"
    ]
  },
  {
    "id": "q_090",
    "question_number": 90,
    "difficulty": "advanced",
    "difficulty_score": 3,
    "topic": "Math & Number Sense",
    "sub_topic": "Fractions",
    "ld_trigger": "dyscalculia",
    "clinical_metric": "Fractions",
    "question_type": "mcq",
    "question_text": "What fraction is shaded? (3/4 shaded circle)",
    "options": [
      "1/2",
      "1/4",
      "3/4"
    ],
    "correct_answer": "3/4",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": true,
    "tags": [
      "fractions",
      "part_whole"
    ]
  },
  {
    "id": "q_091",
    "question_number": 91,
    "difficulty": "advanced",
    "difficulty_score": 3,
    "topic": "Math & Number Sense",
    "sub_topic": "Word Problems - Complex",
    "ld_trigger": "dyscalculia",
    "clinical_metric": "Complex_Word_Problem",
    "question_type": "read_select",
    "question_text": "Sarah has 4 packs of 6 stickers. How many total?",
    "options": [
      "24",
      "28",
      "30"
    ],
    "correct_answer": "24",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "multiplication",
      "word_problems"
    ]
  },
  {
    "id": "q_092",
    "question_number": 92,
    "difficulty": "advanced",
    "difficulty_score": 3,
    "topic": "Math & Number Sense",
    "sub_topic": "Time Telling",
    "ld_trigger": "dyscalculia",
    "clinical_metric": "Time_Reading",
    "question_type": "mcq",
    "question_text": "What time does the clock show? (3:45)",
    "options": [
      "3:45",
      "4:45",
      "3:30"
    ],
    "correct_answer": "3:45",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": true,
    "tags": [
      "time",
      "math"
    ]
  },
  {
    "id": "q_093",
    "question_number": 93,
    "difficulty": "advanced",
    "difficulty_score": 3,
    "topic": "Math & Number Sense",
    "sub_topic": "Data Interpretation",
    "ld_trigger": "dyscalculia",
    "clinical_metric": "Data_Analysis",
    "question_type": "read_select",
    "question_text": "Looking at bar graph, which category has most?",
    "options": [
      "Category options"
    ],
    "correct_answer": "Correct category",
    "requires_audio": false,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": true,
    "tags": [
      "data_interpretation",
      "graphs"
    ]
  },
  {
    "id": "q_094",
    "question_number": 94,
    "difficulty": "advanced",
    "difficulty_score": 3,
    "topic": "Listening & Audio",
    "sub_topic": "Complex Scenario",
    "ld_trigger": "mixed",
    "clinical_metric": "Complex_Listening",
    "question_type": "scenario",
    "question_text": "Listen to story with details. Answer: Why did character decide to ___?",
    "options": [
      "Inference required"
    ],
    "correct_answer": "Correct inference",
    "requires_audio": true,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "listening",
      "inference"
    ]
  },
  {
    "id": "q_095",
    "question_number": 95,
    "difficulty": "advanced",
    "difficulty_score": 3,
    "topic": "Listening & Audio",
    "sub_topic": "Phoneme Segmentation (Audio)",
    "ld_trigger": "mixed",
    "clinical_metric": "Phoneme_Segmentation",
    "question_type": "listen_type",
    "question_text": "Listen and type the word: (cat sound)",
    "options": [
      "c-a-t sounds"
    ],
    "correct_answer": "cat",
    "requires_audio": true,
    "requires_speech": false,
    "requires_typing": true,
    "requires_image": false,
    "tags": [
      "phonemic_awareness",
      "typing"
    ]
  },
  {
    "id": "q_096",
    "question_number": 96,
    "difficulty": "advanced",
    "difficulty_score": 3,
    "topic": "Listening & Audio",
    "sub_topic": "Detailed Comprehension",
    "ld_trigger": "mixed",
    "clinical_metric": "Detailed_Listening",
    "question_type": "scenario",
    "question_text": "Listen to academic passage. Recall: What were the 3 main points?",
    "options": [
      "Multiple points"
    ],
    "correct_answer": "All 3 points recalled",
    "requires_audio": true,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "listening",
      "memory",
      "note_taking"
    ]
  },
  {
    "id": "q_097",
    "question_number": 97,
    "difficulty": "advanced",
    "difficulty_score": 3,
    "topic": "Listening & Audio",
    "sub_topic": "Speaker Interpretation",
    "ld_trigger": "mixed",
    "clinical_metric": "Speaker_Tone",
    "question_type": "scenario",
    "question_text": "Listen to speaker. What emotion or tone is expressed?",
    "options": [
      "Emotion options"
    ],
    "correct_answer": "Correct emotion",
    "requires_audio": true,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "listening",
      "prosody",
      "emotion"
    ]
  },
  {
    "id": "q_098",
    "question_number": 98,
    "difficulty": "advanced",
    "difficulty_score": 3,
    "topic": "Listening & Audio",
    "sub_topic": "Speech Production (Describe)",
    "ld_trigger": "mixed",
    "clinical_metric": "Speech_Production",
    "question_type": "speak_photo",
    "question_text": "Look at picture and describe what you see in detail",
    "options": [
      "Picture provided"
    ],
    "correct_answer": "Detailed description",
    "requires_audio": false,
    "requires_speech": true,
    "requires_typing": false,
    "requires_image": true,
    "tags": [
      "speech",
      "description",
      "vocabulary"
    ]
  },
  {
    "id": "q_099",
    "question_number": 99,
    "difficulty": "advanced",
    "difficulty_score": 3,
    "topic": "Listening & Audio",
    "sub_topic": "Speech Production (Summarize)",
    "ld_trigger": "mixed",
    "clinical_metric": "Speech_Summarize",
    "question_type": "read_speak",
    "question_text": "Read passage and summarize in your own words by speaking",
    "options": [
      "Passage"
    ],
    "correct_answer": "Spoken summary",
    "requires_audio": false,
    "requires_speech": true,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "speech",
      "summarization",
      "comprehension"
    ]
  },
  {
    "id": "q_100",
    "question_number": 100,
    "difficulty": "advanced",
    "difficulty_score": 3,
    "topic": "Listening & Audio",
    "sub_topic": "Interactive Listening",
    "ld_trigger": "mixed",
    "clinical_metric": "Interactive_Listening",
    "question_type": "scenario",
    "question_text": "Listen to scenario and respond with your action. (Multi-choice follow-up)",
    "options": [
      "Scenario with options"
    ],
    "correct_answer": "Correct response",
    "requires_audio": true,
    "requires_speech": false,
    "requires_typing": false,
    "requires_image": false,
    "tags": [
      "interactive_listening",
      "decision_making"
    ]
  }
];

// ─── Helper functions ────────────────────────────────────────────────

/** Get all questions */
const getAllQuestions = () => QUESTION_BANK;

/** Get questions by difficulty level */
const getByDifficulty = (difficulty) =>
  QUESTION_BANK.filter(q => q.difficulty === difficulty.toLowerCase());

/** Get questions by topic */
const getByTopic = (topic) =>
  QUESTION_BANK.filter(q => q.topic.toLowerCase().includes(topic.toLowerCase()));

/** Get questions by LD trigger */
const getByLDTrigger = (trigger) =>
  QUESTION_BANK.filter(q => q.ld_trigger === trigger.toLowerCase());

/** Get questions by question type */
const getByType = (type) =>
  QUESTION_BANK.filter(q => q.question_type === type);

/**
 * Get personalized question set based on student's weak areas
 * @param {Array} weakAreas - Array of { topic, difficulty, accuracy }
 * @param {number} count - Number of questions to return (default 30)
 * @returns {Array} Personalized question set (60% weak areas, 40% growth)
 */
const getPersonalizedSet = (weakAreas = [], count = 30) => {
  const weakCount = Math.floor(count * 0.6);  // 60% weak area questions
  const growthCount = count - weakCount;       // 40% growth/strong area questions
  
  let weakQuestions = [];
  let growthQuestions = [];
  
  // Get questions for weak areas
  for (const area of weakAreas) {
    const matching = QUESTION_BANK.filter(q => 
      q.topic.toLowerCase().includes(area.topic.toLowerCase()) &&
      q.difficulty === area.difficulty
    );
    weakQuestions.push(...matching);
  }
  
  // Deduplicate and limit
  weakQuestions = [...new Set(weakQuestions)].slice(0, weakCount);
  
  // Get growth questions (topics NOT in weak areas, next difficulty up)
  const weakTopics = weakAreas.map(a => a.topic.toLowerCase());
  growthQuestions = QUESTION_BANK.filter(q =>
    !weakTopics.includes(q.topic.toLowerCase())
  ).slice(0, growthCount);
  
  // Combine and shuffle
  const combined = [...weakQuestions, ...growthQuestions];
  return combined.sort(() => Math.random() - 0.5).slice(0, count);
};

/**
 * Analyze student results and generate recommendations
 * @param {Array} answers - Array of { question_id, student_answer, is_correct }
 * @returns {Object} Analysis with per-topic scores, LD risk, and recommendations
 */
const analyzeResults = (answers) => {
  const topicScores = {};
  const difficultyScores = { beginner: { correct: 0, total: 0 }, intermediate: { correct: 0, total: 0 }, advanced: { correct: 0, total: 0 } };
  const ldScores = { dyslexia: { correct: 0, total: 0 }, dysgraphia: { correct: 0, total: 0 }, dyscalculia: { correct: 0, total: 0 }, mixed: { correct: 0, total: 0 } };
  
  for (const ans of answers) {
    const question = QUESTION_BANK.find(q => q.id === ans.question_id);
    if (!question) continue;
    
    // Topic scores
    if (!topicScores[question.topic]) topicScores[question.topic] = { correct: 0, total: 0 };
    topicScores[question.topic].total++;
    if (ans.is_correct) topicScores[question.topic].correct++;
    
    // Difficulty scores
    difficultyScores[question.difficulty].total++;
    if (ans.is_correct) difficultyScores[question.difficulty].correct++;
    
    // LD trigger scores
    ldScores[question.ld_trigger].total++;
    if (ans.is_correct) ldScores[question.ld_trigger].correct++;
  }
  
  // Calculate percentages
  const topicAnalysis = Object.entries(topicScores).map(([topic, s]) => ({
    topic,
    accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
    correct: s.correct,
    total: s.total,
  })).sort((a, b) => a.accuracy - b.accuracy);
  
  const difficultyAnalysis = Object.entries(difficultyScores).map(([level, s]) => ({
    level,
    accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
  }));
  
  // Determine LD risk
  const ldAnalysis = Object.entries(ldScores)
    .filter(([_, s]) => s.total > 0)
    .map(([trigger, s]) => ({
      trigger,
      accuracy: Math.round((s.correct / s.total) * 100),
      risk: s.total > 0 && (s.correct / s.total) < 0.5 ? 'HIGH' : (s.correct / s.total) < 0.7 ? 'MEDIUM' : 'LOW',
    }));
  
  // Generate recommendations
  const weakAreas = topicAnalysis.filter(t => t.accuracy < 70);
  const strongAreas = topicAnalysis.filter(t => t.accuracy >= 70);
  
  const recommendations = weakAreas.map(area => ({
    topic: area.topic,
    accuracy: area.accuracy,
    suggestedAction: area.accuracy < 50 ? 'retry_same_level' : 'transition_harder',
    priority: area.accuracy < 50 ? 'HIGH' : 'MEDIUM',
  }));
  
  return {
    overall: Math.round((answers.filter(a => a.is_correct).length / answers.length) * 100),
    topicAnalysis,
    difficultyAnalysis,
    ldAnalysis,
    weakAreas,
    strongAreas,
    recommendations,
    detectedLD: ldAnalysis.filter(l => l.risk === 'HIGH').map(l => l.trigger),
  };
};

module.exports = {
  QUESTION_BANK,
  getAllQuestions,
  getByDifficulty,
  getByTopic,
  getByLDTrigger,
  getByType,
  getPersonalizedSet,
  analyzeResults,
};
