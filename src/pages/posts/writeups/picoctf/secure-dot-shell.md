<!-- ---
title: "PicoCTF 2026 - Secure Dot Shell"
pubDate: 2026-03-20T14:30:00-04:00
description: "PicoCTF 2026 - Secure Dot Shell Writeup"
author: "internetguy"
layout: ../../../../layouts/DefaultLayout.astro
---

# Secure Dot Shell

[crypto]

_Our intern thought it was a great idea to vibe code a secure dot product server using our AES key. Having taken a class in linear algebra, they're confident the server can't ever leak our key, but I'm not so sure..._

<a href="/posts/writeups/picoctf/remote.py" download>file</a>

`picoCTF{n0t_so_s3cure_.x_w1th_sh@512_[***]}`

# Understanding the Encryption and remote.py

`remote.py` reads from a `flag.txt` on the remote server. A random **32-byte key** and **16-byte initialization vector (IV)** is generated. The flag is encrypted with **AES.MODE_CBC** using the key and IV.

## What is AES.MODE_CBC?

CBC (Cipher Block Chaining) splits the padded plaintext into 16-byte blocks (P1, P2, P3...) and encrypts each block at a time. The ciphertext of the previous block is XOR'ed with the next plaintext before encryption with the key.
So, given plaintext chunks P1, P2, P3..., ciphertext chunks C1, C2, C3...

```text
C1 = encrypt(P1 XOR IV, key)
C2 = encrypt(P2 XOR C1, key)
C3 = encrypt(P3 XOR C2, key)
```

## 5 "trusted" vectors

The 32-byte AES key is converted into a list of integers:

```py
self.key_vector = [byte for byte in key]
```

`generate_trusted_vectors()` -->
