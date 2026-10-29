/**
 * Word & Character Counter Pro — Gamility Tools
 * 100% Client-Side Analytics Engine & Text Metrics
 * Copyright © 2026 Gamility. All rights reserved.
 */

(() => {
  'use strict';

  // --- DOM Elements ---
  const textarea = document.getElementById('text-input');
  const autosaveStatus = document.getElementById('autosave-status');

  // Primary Metrics
  const valWords = document.getElementById('val-words');
  const subWords = document.getElementById('sub-words');
  const valChars = document.getElementById('val-chars');
  const subCharsNoSpaces = document.getElementById('sub-chars-no-spaces');
  const valSentences = document.getElementById('val-sentences');
  const subAvgWordsSentence = document.getElementById('sub-avg-words-sentence');
  const valParagraphs = document.getElementById('val-paragraphs');
  const subLines = document.getElementById('sub-lines');
  const valReadTime = document.getElementById('val-read-time');
  const valSpeakTime = document.getElementById('val-speak-time');

  // Toolbar Actions
  const btnSample = document.getElementById('btn-sample');
  const btnUppercase = document.getElementById('btn-uppercase');
  const btnLowercase = document.getElementById('btn-lowercase');
  const btnTitlecase = document.getElementById('btn-titlecase');
  const btnCopy = document.getElementById('btn-copy');
  const btnClear = document.getElementById('btn-clear');

  // Analysis Elements
  const chkIgnoreStopwords = document.getElementById('chk-ignore-stopwords');
  const keywordsContainer = document.getElementById('keywords-container');

  const scoreCircle = document.getElementById('score-circle');
  const valEaseScore = document.getElementById('val-ease-score');
  const valEaseLabel = document.getElementById('val-ease-label');
  const valEaseDesc = document.getElementById('val-ease-desc');
  const valAvgWordLen = document.getElementById('val-avg-word-len');
  const valAvgSentLen = document.getElementById('val-avg-sent-len');
  const valSyllables = document.getElementById('val-syllables');
  const valLongWords = document.getElementById('val-long-words');

  // Toast
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');

  // Local Storage Key
  const STORAGE_KEY = 'gamility_word_counter_draft';

  // Common English Stop Words
  const STOP_WORDS = new Set([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t',
    'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
    'can', 'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing',
    'don\'t', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t',
    'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers',
    'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in',
    'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t',
    'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our',
    'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s',
    'should', 'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs',
    'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re',
    'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t',
    'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s',
    'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t',
    'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself',
    'yourselves'
  ]);

  const SAMPLE_TEXT = `Welcome to Word & Character Counter Pro by Gamility!

Writing clear and concise prose is an essential craft in modern digital communication. Whether you are composing an academic research article, drafting marketing copy, fine-tuning an email newsletter, or optimizing metadata for search engines, having instant visibility into your text's structural characteristics can significantly improve clarity.

This professional analytical tool measures total words, character count without spacing, sentence complexity, and paragraph frequency in real time. In addition, it calculates estimated reading time at standard adult speeds and conversational speaking cadence.

Best of all, your privacy is unconditionally protected: 100% of calculations occur in-memory within your web browser, with zero telemetry or remote server requests.`;

  let autosaveTimer = null;
  let toastTimer = null;

  // --- Utility Functions ---

  function showToast(msg) {
    if (toastTimer) clearTimeout(toastTimer);
    toastMessage.textContent = msg;
    toast.classList.add('show');
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2200);
  }

  function formatTime(minutesDecimal) {
    if (minutesDecimal <= 0) return '0m 0s';
    const totalSeconds = Math.round(minutesDecimal * 60);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}m ${s}s`;
  }

  // Count syllables in an individual word
  function countWordSyllables(word) {
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
    if (!cleanWord) return 0;
    if (cleanWord.length <= 3) return 1;

    // Remove silent 'e' at end unless preceded by 'le'
    let processed = cleanWord.replace(/(?:[^laeiouy]|ed|es|e)$/, '');
    // Remove consecutive vowel clusters as a single syllable
    const vowelMatches = processed.match(/[aeiouy]{1,2}/g);
    return vowelMatches ? Math.max(1, vowelMatches.length) : 1;
  }

  // --- Core Analytics Engine ---

  function analyzeText() {
    const text = textarea.value;

    // Autosave to localStorage
    if (autosaveTimer) clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, text);
        if (autosaveStatus) {
          autosaveStatus.style.opacity = '1';
        }
      } catch (e) {
        // Fallback for private browsing storage restrictions
      }
    }, 200);

    // Basic Metrics
    const totalChars = text.length;
    const charsNoSpaces = text.replace(/\s/g, '').length;

    // Extract Words (supports unicode letters/numbers, hyphens & apostrophes)
    const wordMatches = text.match(/[\p{L}\p{N}]+(?:['’_-][\p{L}\p{N}]+)*/gu) || [];
    const totalWords = wordMatches.length;

    // Unique Words
    const wordFrequencyMap = new Map();
    let totalSyllables = 0;
    let longWordsCount = 0;

    wordMatches.forEach(rawWord => {
      const lower = rawWord.toLowerCase();
      wordFrequencyMap.set(lower, (wordFrequencyMap.get(lower) || 0) + 1);

      const syllables = countWordSyllables(rawWord);
      totalSyllables += syllables;

      if (rawWord.length > 6) {
        longWordsCount++;
      }
    });

    const uniqueWords = wordFrequencyMap.size;

    // Sentences
    let totalSentences = 0;
    if (text.trim().length > 0) {
      const sentenceChunks = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
      totalSentences = Math.max(1, sentenceChunks.length);
    }

    // Paragraphs & Lines
    let totalParagraphs = 0;
    if (text.trim().length > 0) {
      totalParagraphs = text.split(/\n\s*\n+/).filter(p => p.trim().length > 0).length;
      if (totalParagraphs === 0 && text.trim().length > 0) totalParagraphs = 1;
    }

    const totalLines = text ? text.split('\n').length : 0;

    // Reading & Speaking Times
    const readingMinutes = totalWords / 200;
    const speakingMinutes = totalWords / 130;

    // Average lengths
    const avgWordsPerSentence = totalSentences > 0 ? (totalWords / totalSentences) : 0;
    const avgWordLength = totalWords > 0 ? (charsNoSpaces / totalWords) : 0;

    // Update Top Stat Cards
    valWords.textContent = totalWords.toLocaleString();
    subWords.textContent = `${uniqueWords.toLocaleString()} unique words`;

    valChars.textContent = totalChars.toLocaleString();
    subCharsNoSpaces.textContent = `${charsNoSpaces.toLocaleString()} without spaces`;

    valSentences.textContent = totalSentences.toLocaleString();
    subAvgWordsSentence.textContent = `${avgWordsPerSentence.toFixed(1)} w/sent avg`;

    valParagraphs.textContent = totalParagraphs.toLocaleString();
    subLines.textContent = `${totalLines.toLocaleString()} total lines`;

    valReadTime.textContent = formatTime(readingMinutes);
    valSpeakTime.textContent = formatTime(speakingMinutes);

    // Update Detail Rows
    valAvgWordLen.textContent = `${avgWordLength.toFixed(1)} chars`;
    valAvgSentLen.textContent = `${avgWordsPerSentence.toFixed(1)} words`;
    valSyllables.textContent = totalSyllables.toLocaleString();
    const longWordsPct = totalWords > 0 ? ((longWordsCount / totalWords) * 100).toFixed(1) : 0;
    valLongWords.textContent = `${longWordsCount.toLocaleString()} (${longWordsPct}%)`;

    // Calculate Readability (Flesch Reading Ease)
    updateReadability(totalWords, totalSentences, totalSyllables);

    // Calculate Keyword Density
    updateKeywords(wordFrequencyMap, totalWords);
  }

  // --- Readability Calculation ---

  function updateReadability(totalWords, totalSentences, totalSyllables) {
    if (totalWords < 5 || totalSentences === 0) {
      valEaseScore.textContent = '--';
      valEaseLabel.textContent = 'Awaiting Input';
      valEaseDesc.textContent = 'Type at least 5 words in a sentence to calculate readability grade.';
      scoreCircle.style.borderColor = 'var(--accent-cyan)';
      scoreCircle.style.background = 'rgba(6, 182, 212, 0.08)';
      scoreCircle.style.boxShadow = '0 0 15px rgba(6, 182, 212, 0.2)';
      return;
    }

    // Flesch Reading Ease Formula:
    // 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
    const asw = totalSyllables / totalWords;
    const asl = totalWords / totalSentences;
    let score = Math.round(206.835 - (1.015 * asl) - (84.6 * asw));

    // Clamp between 0 and 100 for display
    score = Math.max(0, Math.min(100, score));

    valEaseScore.textContent = score;

    let grade = '';
    let desc = '';
    let color = '';

    if (score >= 90) {
      grade = 'Very Easy';
      desc = '5th grade level. Extremely easy to read, conversational, and accessible to everyone.';
      color = 'var(--accent-emerald)';
    } else if (score >= 80) {
      grade = 'Easy';
      desc = '6th grade level. Conversational English suitable for standard blog posts and casual writing.';
      color = 'var(--accent-emerald)';
    } else if (score >= 70) {
      grade = 'Fairly Easy';
      desc = '7th grade level. Clear, direct prose suitable for general consumer articles.';
      color = 'var(--accent-cyan)';
    } else if (score >= 60) {
      grade = 'Standard';
      desc = '8th & 9th grade level. Plain English; accessible to the vast majority of adult readers.';
      color = 'var(--accent-blue)';
    } else if (score >= 50) {
      grade = 'Fairly Difficult';
      desc = '10th to 12th grade (high school). Appropriate for business reports and professional papers.';
      color = 'var(--accent-amber)';
    } else if (score >= 30) {
      grade = 'Difficult';
      desc = 'College level. Best suited for academic papers, technical documentation, or specialized journals.';
      color = 'var(--accent-rose)';
    } else {
      grade = 'Very Difficult';
      desc = 'University graduate level. Dense, highly academic or legal prose.';
      color = 'var(--accent-rose)';
    }

    valEaseLabel.textContent = grade;
    valEaseDesc.textContent = desc;

    scoreCircle.style.borderColor = color;
    scoreCircle.style.background = `rgba(${color === 'var(--accent-emerald)' ? '16, 185, 129' : color === 'var(--accent-cyan)' ? '6, 182, 212' : color === 'var(--accent-amber)' ? '245, 158, 11' : '244, 63, 94'}, 0.12)`;
    scoreCircle.style.boxShadow = `0 0 16px rgba(${color === 'var(--accent-emerald)' ? '16, 185, 129' : color === 'var(--accent-cyan)' ? '6, 182, 212' : color === 'var(--accent-amber)' ? '245, 158, 11' : '244, 63, 94'}, 0.25)`;
  }

  // --- Keyword Density Table ---

  function updateKeywords(frequencyMap, totalWords) {
    if (totalWords === 0) {
      keywordsContainer.innerHTML = '<div class="empty-state">Start typing to see keyword density stats.</div>';
      return;
    }

    const ignoreStopWords = chkIgnoreStopwords.checked;

    // Filter and sort entries
    const entries = Array.from(frequencyMap.entries())
      .filter(([term]) => {
        if (term.length <= 1) return false;
        if (ignoreStopWords && STOP_WORDS.has(term)) return false;
        return true;
      })
      .sort((a, b) => b[1] - a[1]);

    if (entries.length === 0) {
      keywordsContainer.innerHTML = '<div class="empty-state">No significant keywords found (check stop-word filter).</div>';
      return;
    }

    const topKeywords = entries.slice(0, 8);
    const maxFreq = topKeywords[0][1];

    let html = '';
    topKeywords.forEach(([term, count]) => {
      const pct = ((count / totalWords) * 100).toFixed(1);
      const barWidth = Math.max(8, Math.round((count / maxFreq) * 100));

      html += `
        <div class="kw-item">
          <span class="kw-term" title="${escapeHtml(term)}">${escapeHtml(term)}</span>
          <div class="kw-bar-track">
            <div class="kw-bar-fill" style="width: ${barWidth}%;"></div>
          </div>
          <div class="kw-stats">
            <span class="kw-count">${count}</span>
            <span class="kw-pct">(${pct}%)</span>
          </div>
        </div>
      `;
    });

    keywordsContainer.innerHTML = html;
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // --- Text Case Helpers ---

  function toTitleCase(str) {
    return str.replace(/\b[\p{L}']+/gu, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }

  // --- Event Listeners ---

  textarea.addEventListener('input', analyzeText);
  chkIgnoreStopwords.addEventListener('change', analyzeText);

  // Load Sample Text
  btnSample.addEventListener('click', () => {
    textarea.value = SAMPLE_TEXT;
    analyzeText();
    showToast('Loaded sample text article');
    textarea.focus();
  });

  // Uppercase
  btnUppercase.addEventListener('click', () => {
    if (!textarea.value) return;
    textarea.value = textarea.value.toUpperCase();
    analyzeText();
    showToast('Transformed to UPPERCASE');
  });

  // Lowercase
  btnLowercase.addEventListener('click', () => {
    if (!textarea.value) return;
    textarea.value = textarea.value.toLowerCase();
    analyzeText();
    showToast('Transformed to lowercase');
  });

  // Title Case
  btnTitlecase.addEventListener('click', () => {
    if (!textarea.value) return;
    textarea.value = toTitleCase(textarea.value);
    analyzeText();
    showToast('Transformed to Title Case');
  });

  // Copy to Clipboard
  btnCopy.addEventListener('click', async () => {
    if (!textarea.value) {
      showToast('Text editor is empty');
      return;
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textarea.value);
      } else {
        textarea.select();
        document.execCommand('copy');
      }
      showToast('Copied text to clipboard!');
    } catch (err) {
      textarea.select();
      document.execCommand('copy');
      showToast('Copied text to clipboard!');
    }
  });

  // Clear Text
  btnClear.addEventListener('click', () => {
    if (!textarea.value) return;
    textarea.value = '';
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    analyzeText();
    showToast('Cleared text editor');
    textarea.focus();
  });

  // Initialize draft from localStorage
  window.addEventListener('DOMContentLoaded', () => {
    try {
      const savedDraft = localStorage.getItem(STORAGE_KEY);
      if (savedDraft) {
        textarea.value = savedDraft;
      }
    } catch (e) {}
    analyzeText();
  });

})();
