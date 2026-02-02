import secrets
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
WORDLIST_PATH = BASE_DIR / "security/wordlist.txt"

_WORDS_CACHE = None


def load_wordlist():
    global _WORDS_CACHE

    if _WORDS_CACHE is None:
        with open(WORDLIST_PATH, "r", encoding="utf-8") as f:
            _WORDS_CACHE = f.read().splitlines()

    return _WORDS_CACHE


def generate_seed(num_words=9):
    words = load_wordlist()
    return [secrets.choice(words) for _ in range(num_words)]
