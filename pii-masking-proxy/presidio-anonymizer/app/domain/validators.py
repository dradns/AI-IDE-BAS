# Validators placeholder
from typing import List

# Luhn checksum (bank cards)
def luhn_ok(num: str) -> bool:
    s = 0
    alt = False
    digits = [c for c in num if c.isdigit()]
    if not digits:
        return False
    for ch in reversed(digits):
        d = ord(ch) - 48
        if alt:
            d *= 2
            if d > 9:
                d -= 9
        s += d
        alt = not alt
    return s % 10 == 0

# SNILS checksum
def snils_checksum_ok(snils: str) -> bool:
    digits = ''.join(ch for ch in snils if ch.isdigit())
    if len(digits) != 11:
        return False
    num = digits[:9]
    try:
        cs = int(digits[9:])
    except ValueError:
        return False
    s = sum(int(num[i]) * (9 - i) for i in range(9))
    if s < 100:
        return cs == s
    if s in (100, 101):
        return cs == 0
    return cs == (s % 101) % 100

# INN checksum (10/12)
def inn_checksum_ok(inn: str) -> bool:
    d = ''.join(ch for ch in inn if ch.isdigit())
    if len(d) == 10:  # company
        w = [2, 4, 10, 3, 5, 9, 4, 6, 8]
        c = sum(int(d[i]) * w[i] for i in range(9)) % 11 % 10
        return c == int(d[9])
    if len(d) == 12:  # individual
        w1 = [7, 2, 4, 10, 3, 5, 9, 4, 6, 8, 0]
        w2 = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8, 0]
        c1 = sum(int(d[i]) * w1[i] for i in range(10)) % 11 % 10
        c2 = sum(int(d[i]) * w2[i] for i in range(11)) % 11 % 10
        return c1 == int(d[10]) and c2 == int(d[11])
    return False

# OGRN/OGRNIP checksum
def ogrn_checksum_ok(ogrn: str) -> bool:
    d = ''.join(ch for ch in ogrn if ch.isdigit())
    if len(d) not in (13, 15):
        return False
    mod = 11
    num = int(d[:-1])
    check = int(d[-1])
    return (num % mod) % 10 == check

# Bank details validation (BIK + r/s, k/s)
WEIGHTS = [7, 1, 3] * 8
WEIGHTS = WEIGHTS[:23]

def bik_ok(bik: str) -> bool:
    d = ''.join(ch for ch in bik if ch.isdigit())
    return len(d) == 9 and d != '0' * 9

def account_checksum_ok(account: str, bik: str, is_corr: bool) -> bool:
    acc = ''.join(ch for ch in account if ch.isdigit())
    b = ''.join(ch for ch in bik if ch.isdigit())
    if len(acc) != 20 or len(b) != 9:
        return False
    control = '0' + (b[4:6] if is_corr else b[6:9]) + acc
    if len(control) != 23:
        return False
    total = 0
    for i, ch in enumerate(control):
        total += int(ch) * WEIGHTS[i]
    return total % 10 == 0

# naive BIK finder used for context when validating accounts
def find_all_biks(text: str) -> List[str]:
    buf, out = [], []
    for ch in text:
        if ch.isdigit():
            buf.append(ch)
        else:
            if buf:
                token = ''.join(buf)
                if len(token) == 9:
                    out.append(token)
                buf = []
    if buf:
        token = ''.join(buf)
        if len(token) == 9:
            out.append(token)
    return out
