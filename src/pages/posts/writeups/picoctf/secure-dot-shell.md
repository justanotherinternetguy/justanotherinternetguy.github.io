---
title: "PicoCTF 2026 - Secure Dot Shell"
pubDate: 2026-03-26T17:00:00-04:00
description: "PicoCTF 2026 - Secure Dot Shell Writeup"
author: "internetguy"
layout: ../../../../layouts/DefaultLayout.astro
---

# Secure Dot Shell

[crypto]

_Our intern thought it was a great idea to vibe code a secure dot product server using our AES key. Having taken a class in linear algebra, they're confident the server can't ever leak our key, but I'm not so sure..._

<a href="/posts/writeups/picoctf/remote.py" download>file</a>

`picoCTF{n0t_so_s3cure_.x_w1th_sh@512_[***]}`

# Summary

We have access to a server that will compute dot products against its secret AES key, but only for "trusted" vectors.

The server prints five trusted vectors and their salted SHA-512 hashes, then lets us submit vectors as long as we also provide the matching salted hash.

However, the server has two bugs that together let us recover the AES key:

- it authenticates vectors with `SHA512(salt || message)`, which is vulnerable to length extension
- it hashes one version of the input, but computes the dot product on a cleaned-up version of that input

# Understanding the Encryption and remote.py

We are given `remote.py`, which reads from a `flag.txt` on the remote server. A random **32-byte key** and **16-byte initialization vector (IV)** is generated. The flag is encrypted with **AES.MODE_CBC** using the key and IV.

## What is AES.MODE_CBC?

CBC (Cipher Block Chaining) splits the padded plaintext into 16-byte blocks (P1, P2, P3...) and encrypts each block at a time. The ciphertext of the previous block is XOR'ed with the next plaintext before encryption with the key.
So, given plaintext chunks P1, P2, P3..., ciphertext chunks C1, C2, C3...

```text
C1 = encrypt(P1 XOR IV, key)
C2 = encrypt(P2 XOR C1, key)
C3 = encrypt(P3 XOR C2, key)
```

To decrypt, we need the key and IV -- both of which the server gives us upfront. So all we need to do is recover the key.

## The dot product oracle

The 32-byte AES key is stored as a list of integers:

```python
self.key_vector = [byte for byte in key]
```

The server generates five random trusted vectors and computes their dot products with `key_vector`. It prints each trusted vector alongside its salted hash:

```python
def hash_vector(self, vector):
    vector_encoding = vector[1:-1].encode('latin-1')
    return hashlib.sha512(self.salt + vector_encoding).digest().hex()
```

So the hash covers `salt || vector[1:-1]` -- the raw string content of the vector, without the outer brackets. The salt is 256 bytes long and secret.

When we submit a vector, the server verifies our hash matches before computing the dot product:

```python
def compute_dot(self, vector):
    parsed = self.parse_vector(vector)
    return sum(a * b for a, b in zip(parsed, self.key_vector))
```

Every accepted query gives us one linear equation: `dot(our_vector, key)`. If we could freely choose vectors, we could recover the key in 32 queries. The hash check is supposed to prevent that.

## Parsing the input

```python
def parse_vector(self, vector):
    sanitized = "".join(c if c in '0123456789,[]' else '' for c in vector)
    ...
```

Only digits, commas, and square brackets survive sanitization. Everything else is silently stripped -- including minus signs.

So if the server trusted the vector `[-5, 10, -7]`, submitting it back would parse as `[5, 10, 7]`. The signs are gone.

We can also see how the server reads input:

```python
vector_input = input("Enter your vector: ")
vector_input = vector_input.encode().decode('unicode_escape')
```

It interprets escape sequences before doing anything else. So if we send `\x80\x00`, the server sees the raw bytes `0x80 0x00`. This is important for smuggling SHA-512 padding bytes through.

# Vulnerability Analysis

## 1. SHA-512 length extension

The server authenticates vectors using `SHA512(salt || message)`. This is called a secret-prefix MAC, and it's insecure with Merkle-Damgård hashes like SHA-512.

SHA-512 processes data in 128-byte blocks. After hashing a message, the internal state is exactly the digest. If you know a digest and the length of the original input, you can continue hashing from that state without needing the salt.

Specifically, given `SHA512(salt || message)` and `len(salt || message)`, we can compute:

```text
SHA512(salt || message || glue_padding || extra)
```

where `glue_padding` is the SHA-512 padding that was appended to `salt || message` internally. The server will accept this hash because it's valid as long as we **extend** the hash without knowing the salt.

## 2. Input sanitation issue

The server hashes the raw vector string but evaluates a sanitized version.

We can inject bytes like `0x80`, `0x00`. Almost all of these are stripped by the sanitizer because they're not in `0123456789,[]`.

So we can forge a hash for `message || glue_padding || extra`, and the server will parse it as roughly `sanitize(message) || sanitize(extra)`.

This gives us a clean split: the hash authenticates the full byte string including padding, but the dot product is computed on a much smaller sanitized string.

# Recovering the Key

## Step 1: Forge a baseline query for each trusted vector

For each trusted `(vector, digest)` pair, we length-extend the hash to cover `message || glue_padding` with no extra suffix. We send this to the server and get back:

```text
baseline = P[0]*k[0] + P[1]*k[1] + ... + P[m-1]*k[m-1]
```

where `P` is the parsed prefix (what survives sanitization) and `k` is the AES key. We compute `P` locally using the same sanitizer, so we know it exactly.

Among the five forged baselines, we pick the one whose parsed prefix `P` is shortest. Call that length `m`.

The shorter the prefix, the fewer key bytes are locked into the baseline and the more we can control with appended tails.

If `m > 5` we can't solve the system with only 5 equations, so we reconnect and try again with a new random instance.

## Step 2: Recover key bytes m through 31

Using the pivot vector (shortest prefix), we append tails like `[0, 0, ..., 1]` where the `1` lands at position `j`. The server returns:

```text
result = baseline + 1 * k[j]
```

So:

```text
k[j] = result - baseline
```

We do this for every `j` from `m` to `31`, recovering the later key bytes one at a time.

## Step 3: Solve the first m key bytes

Each of the five baselines gives us an equation:

```text
R_i = P_i[0]*k[0] + ... + P_i[m-1]*k[m-1] + (known suffix terms)
```

We subtract the known suffix terms (using the key bytes we already recovered) to isolate the first `m` unknowns:

```text
R_i' = P_i[0]*k[0] + ... + P_i[m-1]*k[m-1]
```

This is a linear system with `m` unknowns and up to 5 equations. We solve it exactly using `sympy.Matrix.LUsolve`. Each solution value must be an integer in `[0, 255]` to be a valid key byte.

Once we have all 32 key bytes, standard AES-CBC decryption gives us the flag.

# Solve script

```python
#!/usr/bin/env python3
import ast
from itertools import combinations

from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad
from pwn import context, process, remote
from sympy import Matrix

HOST = "***"
PORT = ***
KEY_SIZE = 32
SALT_SIZE = 256
ALLOWED_CHARS = "0123456789,[]"
MASK64 = (1 << 64) - 1

K = [
    0x428A2F98D728AE22,
    0x7137449123EF65CD,
    0xB5C0FBCFEC4D3B2F,
    0xE9B5DBA58189DBBC,
    0x3956C25BF348B538,
    0x59F111F1B605D019,
    0x923F82A4AF194F9B,
    0xAB1C5ED5DA6D8118,
    0xD807AA98A3030242,
    0x12835B0145706FBE,
    0x243185BE4EE4B28C,
    0x550C7DC3D5FFB4E2,
    0x72BE5D74F27B896F,
    0x80DEB1FE3B1696B1,
    0x9BDC06A725C71235,
    0xC19BF174CF692694,
    0xE49B69C19EF14AD2,
    0xEFBE4786384F25E3,
    0x0FC19DC68B8CD5B5,
    0x240CA1CC77AC9C65,
    0x2DE92C6F592B0275,
    0x4A7484AA6EA6E483,
    0x5CB0A9DCBD41FBD4,
    0x76F988DA831153B5,
    0x983E5152EE66DFAB,
    0xA831C66D2DB43210,
    0xB00327C898FB213F,
    0xBF597FC7BEEF0EE4,
    0xC6E00BF33DA88FC2,
    0xD5A79147930AA725,
    0x06CA6351E003826F,
    0x142929670A0E6E70,
    0x27B70A8546D22FFC,
    0x2E1B21385C26C926,
    0x4D2C6DFC5AC42AED,
    0x53380D139D95B3DF,
    0x650A73548BAF63DE,
    0x766A0ABB3C77B2A8,
    0x81C2C92E47EDAEE6,
    0x92722C851482353B,
    0xA2BFE8A14CF10364,
    0xA81A664BBC423001,
    0xC24B8B70D0F89791,
    0xC76C51A30654BE30,
    0xD192E819D6EF5218,
    0xD69906245565A910,
    0xF40E35855771202A,
    0x106AA07032BBD1B8,
    0x19A4C116B8D2D0C8,
    0x1E376C085141AB53,
    0x2748774CDF8EEB99,
    0x34B0BCB5E19B48A8,
    0x391C0CB3C5C95A63,
    0x4ED8AA4AE3418ACB,
    0x5B9CCA4F7763E373,
    0x682E6FF3D6B2B8A3,
    0x748F82EE5DEFB2FC,
    0x78A5636F43172F60,
    0x84C87814A1F0AB72,
    0x8CC702081A6439EC,
    0x90BEFFFA23631E28,
    0xA4506CEBDE82BDE9,
    0xBEF9A3F7B2C67915,
    0xC67178F2E372532B,
    0xCA273ECEEA26619C,
    0xD186B8C721C0C207,
    0xEADA7DD6CDE0EB1E,
    0xF57D4F7FEE6ED178,
    0x06F067AA72176FBA,
    0x0A637DC5A2C898A6,
    0x113F9804BEF90DAE,
    0x1B710B35131C471B,
    0x28DB77F523047D84,
    0x32CAAB7B40C72493,
    0x3C9EBE0A15C9BEBC,
    0x431D67C49C100D4C,
    0x4CC5D4BECB3E42B6,
    0x597F299CFC657E2A,
    0x5FCB6FAB3AD6FAEC,
    0x6C44198C4A475817,
]


def rotr(value, shift):
    return ((value >> shift) | (value << (64 - shift))) & MASK64


def sha512_padding(message_len):
    zeros = (112 - (message_len + 1) % 128) % 128
    return b"\x80" + (b"\x00" * zeros) + (message_len * 8).to_bytes(16, "big")


def sha512_compress(state, block):
    words = [0] * 80
    for index in range(16):
        start = index * 8
        words[index] = int.from_bytes(block[start:start + 8], "big")

    for index in range(16, 80):
        sigma0 = rotr(words[index - 15], 1) ^ rotr(words[index - 15], 8) ^ (words[index - 15] >> 7)
        sigma1 = rotr(words[index - 2], 19) ^ rotr(words[index - 2], 61) ^ (words[index - 2] >> 6)
        words[index] = (words[index - 16] + sigma0 + words[index - 7] + sigma1) & MASK64

    a, b, c, d, e, f, g, h = state
    for index in range(80):
        sum1 = rotr(e, 14) ^ rotr(e, 18) ^ rotr(e, 41)
        choice = (e & f) ^ (~e & g)
        temp1 = (h + sum1 + choice + K[index] + words[index]) & MASK64
        sum0 = rotr(a, 28) ^ rotr(a, 34) ^ rotr(a, 39)
        majority = (a & b) ^ (a & c) ^ (b & c)
        temp2 = (sum0 + majority) & MASK64

        h = g
        g = f
        f = e
        e = (d + temp1) & MASK64
        d = c
        c = b
        b = a
        a = (temp1 + temp2) & MASK64

    return [
        (state[0] + a) & MASK64,
        (state[1] + b) & MASK64,
        (state[2] + c) & MASK64,
        (state[3] + d) & MASK64,
        (state[4] + e) & MASK64,
        (state[5] + f) & MASK64,
        (state[6] + g) & MASK64,
        (state[7] + h) & MASK64,
    ]


def sha512_length_extend(digest_hex, original_total_len, extra):
    state = [int(digest_hex[offset:offset + 16], 16) for offset in range(0, 128, 16)]
    prior_len = original_total_len + len(sha512_padding(original_total_len))
    data = extra + sha512_padding(prior_len + len(extra))

    for offset in range(0, len(data), 128):
        state = sha512_compress(state, data[offset:offset + 128])

    return "".join(f"{value:016x}" for value in state)


def parse_like_service(decoded_text):
    sanitized = "".join(char if char in ALLOWED_CHARS else "" for char in decoded_text)
    try:
        parsed = ast.literal_eval(sanitized)
    except (SyntaxError, ValueError, TypeError):
        return None
    return parsed if isinstance(parsed, list) else None


def escape_for_unicode_escape(data):
    return "".join(f"\\x{byte:02x}" for byte in data).encode()


def build_query(vector, extra_tail):
    message = str(vector)[1:-1].encode("latin-1")
    glue_padding = sha512_padding(SALT_SIZE + len(message))
    extra = b""
    if extra_tail:
        extra = ("," + ",".join(map(str, extra_tail))).encode()

    raw = b"[" + message + glue_padding + extra + b"]"
    parsed = parse_like_service(raw.decode("latin-1"))
    return raw, parsed, extra


def recv_instance(io):
    iv = None
    ciphertext = None
    trusted_pairs = []

    while len(trusted_pairs) < 5:
        line = io.recvline().decode().rstrip("\n")
        if line.startswith("IV: "):
            iv = bytes.fromhex(line.split(": ", 1)[1])
        elif line.startswith("Ciphertext: "):
            ciphertext = bytes.fromhex(line.split(": ", 1)[1])
        elif line.startswith("(["):
            trusted_pairs.append(ast.literal_eval(line))

    return iv, ciphertext, trusted_pairs


def query(io, vector_text, digest_hex):
    io.sendlineafter(b"Enter your vector: ", vector_text)
    io.sendlineafter(b"Enter its salted hash: ", digest_hex.encode())
    line = io.recvline().decode().strip()
    if not line.startswith("The computed dot product is: "):
        raise ValueError(f"unexpected server response: {line}")
    return int(line.split(": ", 1)[1])


def recover_key(io, trusted_pairs):
    bases = []

    for vector, digest in trusted_pairs:
        raw, parsed, extra = build_query(vector, [])
        if parsed is None or not parsed:
            raise ValueError("forged baseline did not parse as a usable vector")

        digest_ext = sha512_length_extend(digest, SALT_SIZE + len(str(vector)[1:-1]), extra)
        result = query(io, escape_for_unicode_escape(raw), digest_ext)
        bases.append(
            {
                "vector": vector,
                "digest": digest,
                "prefix": parsed,
                "baseline": result,
            }
        )

    pivot_base = min(bases, key=lambda item: len(item["prefix"]))
    pivot_len = len(pivot_base["prefix"])
    if pivot_len > 5:
        raise ValueError(f"instance not solvable enough, smallest prefix is {pivot_len}")

    key = [None] * KEY_SIZE
    baseline = pivot_base["baseline"]

    for index in range(pivot_len, KEY_SIZE):
        tail = [0] * (index - pivot_len) + [1]
        raw, _, extra = build_query(pivot_base["vector"], tail)
        digest_ext = sha512_length_extend(
            pivot_base["digest"],
            SALT_SIZE + len(str(pivot_base["vector"])[1:-1]),
            extra,
        )
        result = query(io, escape_for_unicode_escape(raw), digest_ext)
        key[index] = result - baseline

    rows = []
    rhs = []
    for base in bases:
        rows.append(base["prefix"][:pivot_len])
        known_suffix = sum(
            base["prefix"][index] * key[index]
            for index in range(pivot_len, min(len(base["prefix"]), KEY_SIZE))
        )
        rhs.append(base["baseline"] - known_suffix)

    solved_prefix = None
    for picked in combinations(range(len(rows)), pivot_len):
        matrix = Matrix([rows[index] for index in picked])
        if matrix.det() == 0:
            continue

        solution = matrix.LUsolve(Matrix([rhs[index] for index in picked]))
        candidate = []
        valid = True
        for value in solution:
            if not value.is_integer:
                valid = False
                break
            as_int = int(value)
            if not 0 <= as_int <= 255:
                valid = False
                break
            candidate.append(as_int)

        if valid:
            solved_prefix = candidate
            break

    if solved_prefix is None:
        raise ValueError("could not solve the leading key bytes for this instance")

    key[:pivot_len] = solved_prefix
    return bytes(key)


def decrypt_flag(key, iv, ciphertext):
    cipher = AES.new(key, AES.MODE_CBC, iv)
    return unpad(cipher.decrypt(ciphertext), AES.block_size).decode()


def solve_once(io):
    iv, ciphertext, trusted_pairs = recv_instance(io)
    key = recover_key(io, trusted_pairs)
    return decrypt_flag(key, iv, ciphertext)


def connect(mode):
    if mode == "remote":
        return remote(HOST, PORT)
    if mode == "local":
        return process(["python", "remote.py"])
    raise ValueError("mode must be 'local' or 'remote'")


def main():
    context.log_level = "error"
    attempts = 0

    while True:
        attempts += 1
        io = connect("remote")
        try:
            flag = solve_once(io)
            print(flag)
            print(f"attempts={attempts}")
            return
        except Exception:
            io.close()


if __name__ == "__main__":
    main()
```
