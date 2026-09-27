# Git Workflow & Commit Guidelines

## Repository Information
- **Repository**: `amaxskywithsunshine/amaxskywithsunshine.github.io`
- **Remote URL**: `https://github.com/amaxskywithsunshine/amaxskywithsunshine.github.io.git`
- **Default Branch**: `main`

## Commit & Push Procedures
Whenever asked to commit or push changes:
1. **Check Status**:
   ```bash
   git status
   ```
2. **Review Diff**:
   ```bash
   git diff
   ```
3. **Stage Changes**:
   ```bash
   git add <modified_files>
   ```
4. **Commit Message Style**:
   Follow Conventional Commits with clear, descriptive messages:
   - `docs: update About overview and background copy across all languages`
   - `feat: add ...`
   - `fix: resolve ...`
   ```bash
   git commit -m "<type>: <concise description>"
   ```
5. **Push to Remote**:
   When the user asks to commit to the repo / push to GitHub:
   ```bash
   git push origin main
   ```
6. **Verify State**:
   Ensure `git status` indicates `nothing to commit, working tree clean` and the branch is up to date with `origin/main`.

## Multilingual Project Rules
- The site supports 4 languages: **EN** (English), **TH** (ไทย), **JP** (日本語), and **CN** (中文).
- Text updates to portfolio sections (About, Works) should be kept in sync across `I18N_DATA` in `script.js` and initial fallback markup in `index.html`.
- Run `node --check script.js` to ensure JavaScript syntax validity before committing.
