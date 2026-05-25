---
title: "Learning Emacs: Part 1"
pubDate: 2026-05-25T14:00:00-04:00
description: "f**k obsidian"
author: "internetguy"
layout: ../../../layouts/DefaultLayout.astro
---


# Learning Emacs: P1 (The Basics)

#

I am tired of Obsidian. Really. I've been using Obsidian for around 4 years and have gone through 8 different iterations of my note-taking/PKM setup. Obsidian is becoming too cluttered, bloated, and slow. I have too many plugins and random shit that takes several seconds to all load in when starting Obsidian.

I have been eyeing Emacs' [Org Mode](https://orgmode.org/) for a long time as an alternative PKM setup. Having been a (n)Vim using my entire life, Emacs seems rather unintuitive and intimidating. While I have tried to learn Emacs on other occasions, I have always given up just after a few days at most. I just felt slow and hampered by the weird settings and defaults that Emacs has.

#
Today will be different. Now driven by a *actual* motivation to replace my PKM and use org-mode, I need to *actually*, *properly*, learn Emacs and Emacs configuration. I plan on learning this over the course of the next few months over the summer, just in time to put my fancy new org-mode setup to use in college.


#

For now, I'll start with a very basic configuration in `~/.config/emacs/init.el`:

```lisp
(setq inhibit-startup-message t)
(scroll-bar-mode -1)
(tool-bar-mode -1)
(tooltip-mode -1)
(set-fringe-mode 10)
(menu-bar-mode -1)
(setq visible-bell t)
(custom-set-variables
 ;; custom-set-variables was added by Custom.
 ;; If you edit it by hand, you could mess it up, so be careful.
 ;; Your init file should contain only one such instance.
 ;; If there is more than one, they won't work right.
 '(package-selected-packages '(markdown-mode)))
(custom-set-faces
 ;; custom-set-faces was added by Custom.
 ;; If you edit it by hand, you could mess it up, so be careful.
 ;; Your init file should contain only one such instance.
 ;; If there is more than one, they won't work right.
 )
```


And for some keybind references:


- `M-x dired` = dired file manager
- `C-x 1` = keep current buffer
- `C-x 2` = hsplitd
- `C-x 3` = vsplit
- `C-x o` = switch to next buffer
- `C-x C-s` = write file
- `C-x C-z` = close emacs
- `C-x C-f` = create/find/open file
- `M-w` = copy
- `C-y` = paste
- `C-/` or `C-x u` = undo
- `M-x package-install` = install package from ELPA
- in dired...
  - `+` = new folder
  - `g` = refresh
- `C-x b` = go back to previous buffer
