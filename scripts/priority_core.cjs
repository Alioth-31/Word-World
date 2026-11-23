'use strict';
const fs = require('fs');
const path = require('path');

function number(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const n = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function pick(record, ...keys) {
  for (const key of keys) if (Object.prototype.hasOwnProperty.call(record, key)) return record[key];
  return undefined;
}

function parseVocabulary(input) {
  if (Array.isArray(input)) return input;
  if (!input || typeof input !== 'object') throw new Error('Invalid dictionary JSON');
  const known = input['5530考研词汇词频排序表'];
  if (Array.isArray(known)) return known;
  const tables = Object.entries(input).filter(([, value]) => Array.isArray(value));
  if (tables.length === 1) return tables[0][1];
  throw new Error('Cannot locate main vocabulary array in source data');
}

function percentile95(values) {
  if (!values.length) return 1;
  const sorted = [...values].sort((a, b) => a - b);
  const result = sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)];
  return Math.max(1, result);
}

function scaled(value, p95) {
  return Math.min(1, Math.log1p(Math.max(0, value)) / Math.log1p(Math.max(1, p95)));
}

function readExamOneCorpus(corpusDir) {
  if (!corpusDir || !fs.existsSync(corpusDir)) return null;
  const base = path.join(corpusDir, 'data');
  if (!fs.existsSync(base)) return null;
  const counts = new Map();
  const years = new Map();
  const availableYears = [];
  for (const folder of fs.readdirSync(base).sort()) {
    const match = /^(20\d\d)-1$/.exec(folder);
    if (!match || Number(match[1]) < 2010 || Number(match[1]) > 2025) continue;
    const filename = path.join(base, folder, folder + '.json');
    if (!fs.existsSync(filename)) continue;
    let paper;
    try { paper = JSON.parse(fs.readFileSync(filename, 'utf8')); }
    catch (_) { continue; }
    if (paper.exam !== '英语一' || !Array.isArray(paper.sections)) continue;
    const phrases = [];
    for (const section of paper.sections) {
      for (const group of section.groups || []) {
        if (typeof group.passage === 'string') phrases.push(group.passage);
        else if (Array.isArray(group.passage)) phrases.push(...group.passage.filter(x=>typeof x === 'string'));
      }
    }
    if (!phrases.length) continue;
    availableYears.push(Number(match[1]));
    const observed = new Set();
    for (const phrase of [...new Set(phrases)]) {
      // Passage text only: question explanations, answer options and translations are excluded.
      const tokens = phrase.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) || [];
      for (const token of tokens) {
        const word = token.toLowerCase();
        counts.set(word, (counts.get(word) || 0) + 1);
        observed.add(word);
      }
    }
    for (const word of observed) years.set(word, (years.get(word) || 0) + 1);
  }
  return availableYears.length ? { counts, years, availableYears } : null;
}

function generatePriority(input, corpus = null) {
  const rows = parseVocabulary(input);
  const byWord = new Map();
  for (const row of rows) {
    const word = String(pick(row, '单词', 'word') ?? '').trim();
    if (!word || byWord.has(word)) continue;
    const examRaw = pick(row, '真题次数', 'exam_count', 'examCount');
    const examCountAvailable = examRaw !== undefined && examRaw !== null && String(examRaw).trim() !== '';
    const rec = {
      word,
      examCount: number(examRaw),
      examCountAvailable,
      mixedFreq: number(pick(row, '词频', 'frequency', 'freq')),
      cefr: String(pick(row, 'CEFR等级', 'cefr') ?? '').toUpperCase().trim(),
      academic: ['1', 'true', 'yes', '是'].includes(String(pick(row, '学术词汇', 'academic') ?? '').toLowerCase().trim()),
      corpusCount: corpus ? (corpus.counts.get(word.toLowerCase()) || 0) : null,
      corpusYears: corpus ? (corpus.years.get(word.toLowerCase()) || 0) : null
    };
    byWord.set(word, rec);
  }
  const records = [...byWord.values()];
  if (records.length === 0) throw new Error('Vocabulary source contains no words');
  const examP95 = percentile95(records.filter(x => x.examCountAvailable).map(x => x.examCount));
  const freqP95 = percentile95(records.map(x => x.mixedFreq));
  const corpusP95 = corpus ? percentile95(records.map(x => x.corpusCount)) : 1;
  const maxYears = corpus ? corpus.availableYears.length : 1;
  const levels = { A1: 0, A2: 0.25, B1: 0.5, B2: 0.75, C1: 1, C2: 1 };

  for (const r of records) {
    const difficulty = levels[r.cefr] ?? 0.4;
    const academic = r.academic ? 1 : 0;
    if (corpus) {
      r.score = 100 * (0.48 * scaled(r.corpusCount, corpusP95)
        + 0.19 * (r.corpusYears / maxYears)
        + 0.16 * (r.examCountAvailable ? scaled(r.examCount, examP95) : scaled(r.mixedFreq, freqP95))
        + 0.12 * scaled(r.mixedFreq, freqP95) + 0.04 * difficulty + 0.01 * academic);
      r.basis = `英语一真题正文原形词频（${corpus.availableYears.join(',')}）+补充数据`;
    } else if (r.examCountAvailable) {
      r.score = 100 * (0.62 * scaled(r.examCount, examP95)
        + 0.28 * scaled(r.mixedFreq, freqP95) + 0.07 * difficulty + 0.03 * academic);
      r.basis = '真题样本次数+混合考试词频';
    } else {
      r.score = 100 * (0.90 * scaled(r.mixedFreq, freqP95) + 0.07 * difficulty + 0.03 * academic);
      r.basis = '仅混合考试词频（缺少真题次数）';
    }
  }
  records.sort((a,b) => b.score - a.score || b.examCount - a.examCount || b.mixedFreq - a.mixedFreq || a.word.localeCompare(b.word, 'en'));
  const ranked = Object.create(null);
  const counts = { P0: 0, P1: 0, P2: 0, P3: 0 };
  const n = records.length;
  records.forEach((row, i) => {
    const fraction = i / n;
    const level = fraction < 0.2 ? 'P0' : fraction < 0.5 ? 'P1' : fraction < 0.8 ? 'P2' : 'P3';
    counts[level]++;
    ranked[row.word] = {
      rank: i + 1,
      level,
      score: Math.round(row.score * 100) / 100,
      examCount: row.examCountAvailable ? row.examCount : null,
      mixedFreq: row.mixedFreq,
      exam1Count: row.corpusCount,
      exam1Years: row.corpusYears,
      basis: row.basis
    };
  });
  return { count: n, counts, records: ranked, source: 'exam-data/NETEMVocabulary（源工程自带数据）',
    description: '真题次数是源数据的2005–2023年真题词表统计；混合词频来自四六级、考研及专四专八等试卷，非纯英语一词频。',
    corpusYears: corpus ? corpus.availableYears : [],
    method: corpus ? '若有2010–2025英语一正文：48%正文原形词频+19%出现年份覆盖+16%来源真题次数（缺失用混合词频）+12%混合词频+4%CEFR+1%学术词。正文仅逐词精确匹配，未执行完整词形还原。' : '有真题次数:62%真题样本+28%混合考试词频+7%CEFR+3%学术词标签；缺失时按混合考试词频排序。分层按20%/30%/30%/20%分位数，不是官方难度等级。' };
}
module.exports = { generatePriority, parseVocabulary, readExamOneCorpus };
