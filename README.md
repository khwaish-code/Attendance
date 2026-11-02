# Our Little Love Diary 💗

A cute romantic attendance diary for two partners.

Built entirely with:
- HTML
- CSS
- Vanilla JavaScript
- Browser localStorage

No database, server, backend, npm or installation required.

## Project files

index.html
style.css
script.js
README.md

## How to publish on GitHub Pages

### Step 1: Create a repository

1. Sign in to GitHub.
2. Click New Repository.
3. Name it `our-little-love-diary`.
4. Choose Public or Private.
5. Click Create Repository.

### Step 2: Upload the files

Upload these four files into the root of the repository:

- index.html
- style.css
- script.js
- README.md

Make sure index.html is directly inside the repository,
not inside another folder.

Click Commit Changes.

### Step 3: Enable GitHub Pages

1. Open your repository.
2. Click Settings.
3. Select Pages from the sidebar.
4. Find Build and Deployment.
5. Select Deploy from a branch.
6. Select branch: main.
7. Select folder: / (root).
8. Click Save.

### Step 4: Open your website

Wait for GitHub Pages to publish your website.

Your website will be available at:

https://YOUR-USERNAME.github.io/our-little-love-diary/

Replace YOUR-USERNAME with your GitHub username.

## How to use

1. Enter both partner names.
2. Select Available or Unavailable for each partner.
3. Save today's attendance.
4. Open the calendar to add or edit previous dates.
5. Use the arrows to navigate between months.
6. View monthly attendance statistics.
7. Export your diary as JSON to share it.

## Attendance rules

Both available:
Both partners present.

Partner 1 available:
Partner 1 present, Partner 2 absent.

Partner 2 available:
Partner 2 present, Partner 1 absent.

Both unavailable:
Shared holiday.

Shared holidays are excluded from attendance percentages.

Individual percentage:
Present days / Non-holiday recorded days × 100.

Combined percentage:
Both-present days / Non-holiday recorded days × 100.

Percentages use recorded days only, not all calendar days.

## Data storage

Attendance and profile information are saved in
the browser's localStorage.

This means:

- Each device has its own diary.
- There is no automatic synchronization.
- There are no secure user accounts.
- There is no password protection.
- Clearing browser data may erase the diary.

## Sharing between partners

1. Open Diary & Data.
2. Click Export JSON Backup.
3. Send the downloaded file to your partner.
4. Your partner opens the website.
5. Click Import JSON Backup.
6. Select the file.
7. Confirm the replacement.

Import replaces the existing diary. It does not merge
two different backups.

Always export a backup before importing.

## Privacy

This website does not transmit attendance data to
a database or backend.

The data stays in the browser's local storage
for the website's origin.

Anyone with access to that browser profile may
be able to access the diary.

Keep backups of important records.
