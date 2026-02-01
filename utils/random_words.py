import urllib.request
import random

mit = "https://www.mit.edu/~ecprice/wordlist.10000"

response = urllib.request.urlopen(mit)
long_txt = response.read().decode()

with open("wordlist.txt", "w", encoding="utf-8") as f:
    f.write(long_txt)

with open("wordlist.txt", "r", encoding="utf-8") as f:
    words = f.read().splitlines()

random_words = random.sample(words, 9)

print(random_words)
