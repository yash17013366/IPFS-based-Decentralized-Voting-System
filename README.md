# 🗳️ Decentralized Voting System

A lightweight browser-based voting system built to explore how decentralized storage concepts can be applied to institutional elections such as student council voting, club committee selection, or internal organization polls.

The project digitizes the basic election workflow — candidate setup, voter registration, vote casting, one-voter-one-vote validation, live result tracking, and winner declaration — while using IPFS for decentralized data storage instead of a traditional backend database.

---

## 📌 Overview

Traditional small-scale voting processes are often handled manually through paper ballots, spreadsheets, or informal online forms. These approaches can lead to duplicate voting, counting errors, and poor transparency.

This project was built as a learning-focused implementation of a decentralized voting workflow that demonstrates:
- one-voter-one-vote validation
- candidate and voter management
- live result tracking
- decentralized storage using IPFS
- a more transparent and tamper-evident voting process

---

## 🎯 Use Cases

This system is suitable for small-scale controlled voting scenarios such as:
- college or university student council elections
- club or committee representative selection
- internal voting in educational institutions
- small organization polls and elections

---

## ✨ Features

- Candidate management
- Voter registration with unique Voter IDs
- One-voter-one-vote validation
- Vote casting through Voter ID verification
- Live result tracking
- Automatic winner declaration
- IPFS-based decentralized vote/state storage
- Export voting data as JSON
- Printable voter cards for registered voters

---

## ⚙️ How It Works

1. Admin adds candidates to the election.
2. Admin registers voters and the system generates a unique Voter ID for each voter.
3. Voters cast their vote using their assigned Voter ID.
4. The system validates the voter and ensures the same ID cannot vote twice.
5. Votes are recorded and the results update live.
6. Once voting ends, the system declares the winner automatically.
7. Election data can be exported for record keeping.

---

## 🛠️ Tech Stack

Frontend:
- HTML
- CSS
- JavaScript

Storage / Decentralized Layer:
- IPFS
- localStorage fallback

Other:
- ipfs-http-client

---

## 📂 Project Structure

.
├── index.html
├── styles.css
├── script.js
├── ipfs-service.js
├── package.json
└── package-lock.json

- index.html → main application UI
- styles.css → styling and layout
- script.js → voting logic, candidate/voter handling, UI updates
- ipfs-service.js → IPFS storage and retrieval logic

---

## 🚀 Running Locally

1. Clone the repository

git clone <your-repo-link>
cd <repo-folder>

2. Install dependencies

npm install

3. Start a local server

npm run dev

4. Open the project in your browser.

---

## 📚 Learning Outcome

This project was mainly built as a learning exercise to understand:
- how decentralized storage works in a practical application
- how a digital voting workflow can be structured
- how IPFS can be used for storing application state and vote records
- how transparency and auditability can be improved in simple institutional voting systems

