/* Original pilot exercises; not past examination questions. */
window.WORD_WORLD_ABILITIES = [
  {
    "id": "address-sense",
    "word": "address",
    "skill": "context",
    "explanation": "address a problem：处理、解决问题",
    "variants": [
      {
        "prompt": "The report addresses a growing concern about housing.",
        "target": "addresses",
        "options": [
          "处理",
          "寄送",
          "居住",
          "计算"
        ],
        "correct": 0
      },
      {
        "prompt": "The committee must address the causes of the delay.",
        "target": "address",
        "options": [
          "致信",
          "处理",
          "登记",
          "衡量"
        ],
        "correct": 1
      }
    ]
  },
  {
    "id": "account-sense",
    "word": "account",
    "skill": "context",
    "explanation": "account：叙述、说明",
    "variants": [
      {
        "prompt": "She gave a detailed account of the accident.",
        "target": "account",
        "options": [
          "叙述",
          "银行账户",
          "比例",
          "价格"
        ],
        "correct": 0
      },
      {
        "prompt": "His account of the journey differed from hers.",
        "target": "account",
        "options": [
          "费用",
          "叙述",
          "存款",
          "速度"
        ],
        "correct": 1
      }
    ]
  },
  {
    "id": "fine-sense",
    "word": "fine",
    "skill": "context",
    "explanation": "fine：罚款",
    "variants": [
      {
        "prompt": "The company was ordered to pay a heavy fine.",
        "target": "fine",
        "options": [
          "罚款",
          "细节",
          "赞扬",
          "工资"
        ],
        "correct": 0
      },
      {
        "prompt": "Drivers who break this rule may receive a fine.",
        "target": "fine",
        "options": [
          "礼物",
          "罚款",
          "许可",
          "折扣"
        ],
        "correct": 1
      }
    ]
  },
  {
    "id": "subject-sense",
    "word": "subject",
    "skill": "context",
    "explanation": "be subject to：受……约束；可能发生",
    "variants": [
      {
        "prompt": "The schedule is subject to change.",
        "target": "subject to",
        "options": [
          "受……影响而可能改变",
          "负责改变",
          "拒绝改变",
          "已经改变"
        ],
        "correct": 0
      },
      {
        "prompt": "All applications are subject to approval.",
        "target": "subject to",
        "options": [
          "无需批准",
          "必须经过批准",
          "已经批准",
          "负责批准"
        ],
        "correct": 1
      }
    ]
  },
  {
    "id": "charge-sense",
    "word": "charge",
    "skill": "context",
    "explanation": "charge：指控",
    "variants": [
      {
        "prompt": "He denied the charge of theft.",
        "target": "charge",
        "options": [
          "电荷",
          "指控",
          "费用",
          "职责"
        ],
        "correct": 1
      },
      {
        "prompt": "The court dismissed the charge against her.",
        "target": "charge",
        "options": [
          "充电",
          "收费",
          "指控",
          "照管"
        ],
        "correct": 2
      }
    ]
  },
  {
    "id": "issue-sense",
    "word": "issue",
    "skill": "context",
    "explanation": "issue：发布、发行",
    "variants": [
      {
        "prompt": "The agency issued a warning yesterday.",
        "target": "issued",
        "options": [
          "发布",
          "解决",
          "收回",
          "复印"
        ],
        "correct": 0
      },
      {
        "prompt": "The bank will issue new cards next month.",
        "target": "issue",
        "options": [
          "取消",
          "发行",
          "借用",
          "检查"
        ],
        "correct": 1
      }
    ]
  },
  {
    "id": "account-collocation",
    "word": "account",
    "skill": "collocation",
    "explanation": "account for：解释……的原因",
    "variants": [
      {
        "prompt": "Several factors account ___ the difference.",
        "target": "",
        "options": [
          "for",
          "to",
          "at",
          "into"
        ],
        "correct": 0
      },
      {
        "prompt": "How do you account ___ the sudden increase?",
        "target": "",
        "options": [
          "on",
          "by",
          "for",
          "with"
        ],
        "correct": 2
      }
    ]
  },
  {
    "id": "benefit-collocation",
    "word": "benefit",
    "skill": "collocation",
    "explanation": "benefit from：从……获益",
    "variants": [
      {
        "prompt": "Students benefit ___ regular practice.",
        "target": "",
        "options": [
          "at",
          "from",
          "onto",
          "by"
        ],
        "correct": 1
      },
      {
        "prompt": "Small firms may benefit ___ the new policy.",
        "target": "",
        "options": [
          "to",
          "of",
          "from",
          "into"
        ],
        "correct": 2
      }
    ]
  },
  {
    "id": "object-collocation",
    "word": "object",
    "skill": "collocation",
    "explanation": "object to doing：反对做某事",
    "variants": [
      {
        "prompt": "They object ___ paying extra fees.",
        "target": "",
        "options": [
          "on",
          "for",
          "to",
          "at"
        ],
        "correct": 2
      },
      {
        "prompt": "She objects ___ being treated unfairly.",
        "target": "",
        "options": [
          "by",
          "to",
          "with",
          "from"
        ],
        "correct": 1
      }
    ]
  },
  {
    "id": "view-collocation",
    "word": "view",
    "skill": "collocation",
    "explanation": "view A as B：把 A 视为 B",
    "variants": [
      {
        "prompt": "Many people view education ___ an investment.",
        "target": "",
        "options": [
          "as",
          "from",
          "of",
          "to"
        ],
        "correct": 0
      },
      {
        "prompt": "The team views the setback ___ an opportunity.",
        "target": "",
        "options": [
          "in",
          "by",
          "as",
          "for"
        ],
        "correct": 2
      }
    ]
  },
  {
    "id": "charge-collocation",
    "word": "charge",
    "skill": "collocation",
    "explanation": "in charge of：负责",
    "variants": [
      {
        "prompt": "Who is in charge ___ the project?",
        "target": "",
        "options": [
          "on",
          "of",
          "for",
          "to"
        ],
        "correct": 1
      },
      {
        "prompt": "She is in charge ___ organizing the event.",
        "target": "",
        "options": [
          "from",
          "at",
          "of",
          "with"
        ],
        "correct": 2
      }
    ]
  },
  {
    "id": "conduct-collocation",
    "word": "conduct",
    "skill": "collocation",
    "explanation": "conduct research：开展研究",
    "variants": [
      {
        "prompt": "The scientists ___ research on air quality.",
        "target": "",
        "options": [
          "conduct",
          "lend",
          "wear",
          "owe"
        ],
        "correct": 0
      },
      {
        "prompt": "The team plans to ___ a survey next year.",
        "target": "",
        "options": [
          "borrow",
          "conduct",
          "fold",
          "pour"
        ],
        "correct": 1
      }
    ]
  },
  {
    "id": "benefit-spelling",
    "word": "benefit",
    "skill": "spelling",
    "explanation": "benefit：益处；使受益",
    "variants": [
      {
        "prompt": "益处；使受益（b 开头，7 个字母）",
        "answer": "benefit"
      },
      {
        "prompt": "从……获益：___ from（b 开头）",
        "answer": "benefit"
      }
    ]
  },
  {
    "id": "claim-spelling",
    "word": "claim",
    "skill": "spelling",
    "explanation": "claim：声称；要求",
    "variants": [
      {
        "prompt": "声称；主张（c 开头，5 个字母）",
        "answer": "claim"
      },
      {
        "prompt": "She ___s that the data are inaccurate. 填动词原形（声称）",
        "answer": "claim"
      }
    ]
  },
  {
    "id": "conduct-spelling",
    "word": "conduct",
    "skill": "spelling",
    "explanation": "conduct：实施；主持",
    "variants": [
      {
        "prompt": "实施；主持（c 开头，7 个字母）",
        "answer": "conduct"
      },
      {
        "prompt": "开展实验：___ an experiment（c 开头）",
        "answer": "conduct"
      }
    ]
  },
  {
    "id": "subject-spelling",
    "word": "subject",
    "skill": "spelling",
    "explanation": "subject：主题；受……制约",
    "variants": [
      {
        "prompt": "主题；学科（s 开头，7 个字母）",
        "answer": "subject"
      },
      {
        "prompt": "受……约束：be ___ to（s 开头）",
        "answer": "subject"
      }
    ]
  },
  {
    "id": "address-spelling",
    "word": "address",
    "skill": "spelling",
    "explanation": "address：地址；处理",
    "variants": [
      {
        "prompt": "地址；处理（a 开头，7 个字母）",
        "answer": "address"
      },
      {
        "prompt": "解决问题：___ a problem（a 开头）",
        "answer": "address"
      }
    ]
  },
  {
    "id": "account-spelling",
    "word": "account",
    "skill": "spelling",
    "explanation": "account：账户；叙述",
    "variants": [
      {
        "prompt": "账户；叙述（a 开头，7 个字母）",
        "answer": "account"
      },
      {
        "prompt": "解释……原因：___ for（a 开头）",
        "answer": "account"
      }
    ]
  }
];
