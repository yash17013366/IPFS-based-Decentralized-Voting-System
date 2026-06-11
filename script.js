// Voting System Data
let votingSystem = {
    candidates: [],
    voters: [],
    votes: {},
    votingEnded: false,
    votingDeadline: Date.now() + (24 * 60 * 60 * 1000), // 24 hours from now
    adminPassword: 'admin123'
};

// DOM Elements
const elements = {
    votingStatus: document.getElementById('voting-status'),
    totalVotes: document.getElementById('total-votes'),
    candidateCount: document.getElementById('candidate-count'),
    timeRemaining: document.getElementById('time-remaining'),
    participationRate: document.getElementById('participation-rate'),
    remainingVoters: document.getElementById('remaining-voters'),
    votersList: document.getElementById('voters-list'),
    candidatesList: document.getElementById('candidates-list'),
    resultsChart: document.getElementById('results-chart'),
    winnerSection: document.getElementById('winner-section'),
    winnerDisplay: document.getElementById('winner-display'),
    message: document.getElementById('message'),
    ipfsIndicator: document.getElementById('ipfs-indicator'),
    ipfsHash: document.getElementById('ipfs-hash')
};

// Initialize the system
async function init() {
    await loadFromIPFS();
    updateUI();
    startTimer();
    updateIPFSStatus();
}

// Load data from IPFS
async function loadFromIPFS() {
    try {
        const data = await window.ipfsService.loadVotingData();
        if (data) {
            votingSystem = data;
            console.log('Data loaded from IPFS successfully');
        } else {
            console.log('No IPFS data found, using default state');
        }
    } catch (error) {
        console.error('Error loading from IPFS:', error);
        // Fallback to localStorage if IPFS fails
        loadFromStorage();
    }
}

// Save data to IPFS
async function saveToIPFS() {
    try {
        const hash = await window.ipfsService.saveVotingData(votingSystem);
        updateIPFSStatus(hash);
        console.log('Data saved to IPFS:', hash);
        return hash;
    } catch (error) {
        console.error('Error saving to IPFS:', error);
        // Fallback to localStorage
        saveToStorage();
        showMessage('IPFS save failed, using local storage', 'warning');
    }
}

// Fallback functions for localStorage
function loadFromStorage() {
    const saved = localStorage.getItem('votingSystem');
    if (saved) {
        votingSystem = JSON.parse(saved);
    }
}

function saveToStorage() {
    localStorage.setItem('votingSystem', JSON.stringify(votingSystem));
}

// Show message
function showMessage(text, type = 'success') {
    elements.message.textContent = text;
    elements.message.className = `message ${type} show`;
    
    setTimeout(() => {
        elements.message.classList.remove('show');
    }, 3000);
}

// Update IPFS status
function updateIPFSStatus(hash = null) {
    if (window.ipfsService && window.ipfsService.ipfs) {
        elements.ipfsIndicator.textContent = '🟢 IPFS: Connected';
        elements.ipfsIndicator.style.color = '#4CAF50';
    } else {
        elements.ipfsIndicator.textContent = '🟡 IPFS: Using Gateway';
        elements.ipfsIndicator.style.color = '#FF9800';
    }
    
    if (hash) {
        elements.ipfsHash.textContent = `Hash: ${hash.substring(0, 20)}...`;
        elements.ipfsHash.title = hash;
    } else {
        const storedHash = localStorage.getItem('votingDataHash');
        if (storedHash) {
            elements.ipfsHash.textContent = `Hash: ${storedHash.substring(0, 20)}...`;
            elements.ipfsHash.title = storedHash;
        } else {
            elements.ipfsHash.textContent = 'No data saved yet';
        }
    }
}

// Update all UI elements
function updateUI() {
    updateStatus();
    updateVotersList();
    updateCandidatesList();
    updateResultsChart();
    updateWinner();
}

// Update status section
function updateStatus() {
    const { isOpen, timeRemaining, totalVotes } = getVotingStatus();
    const stats = getVotingStatistics();
    
    elements.votingStatus.textContent = isOpen ? 'Open' : 'Ended';
    elements.totalVotes.textContent = totalVotes;
    elements.candidateCount.textContent = votingSystem.candidates.length;
    elements.timeRemaining.textContent = timeRemaining;
    elements.participationRate.textContent = `${stats.participationRate}%`;
    elements.remainingVoters.textContent = stats.remainingVoters;
}

// Get voting status
function getVotingStatus() {
    const now = Date.now();
    const timeRemaining = Math.max(0, votingSystem.votingDeadline - now);
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    
    const isOpen = !votingSystem.votingEnded && (hours > 0 || minutes > 0);
    const timeRemainingText = hours === 0 && minutes === 0 ? 'Ended' : `${hours}h ${minutes}m`;
    const totalVotes = Object.keys(votingSystem.votes).length;
    
    return { isOpen, timeRemaining: timeRemainingText, totalVotes };
}

// Update voters list
function updateVotersList() {
    if (votingSystem.voters.length === 0) {
        elements.votersList.innerHTML = '<p class="empty-message">No voters added yet.</p>';
        return;
    }
    
    elements.votersList.innerHTML = votingSystem.voters.map(voter => {
        const hasVoted = votingSystem.votes.hasOwnProperty(voter.id);
        const statusClass = hasVoted ? 'voted' : 'whitelisted';
        const statusText = hasVoted ? 'Voted' : 'Whitelisted';
        
        return `
            <div class="voter-card">
                <h4>${voter.name}</h4>
                <div class="voter-id" onclick="copyToClipboard('${voter.id}')" title="Click to copy ID">
                    ID: ${voter.id} 📋
                </div>
                <div class="voter-status ${statusClass}">${statusText}</div>
            </div>
        `;
    }).join('');
}

// Update candidates list
function updateCandidatesList() {
    if (votingSystem.candidates.length === 0) {
        elements.candidatesList.innerHTML = '<p class="empty-message">No candidates added yet.</p>';
        return;
    }
    
    elements.candidatesList.innerHTML = votingSystem.candidates.map((candidate, index) => {
        const voteCount = getVoteCount(candidate.id);
        
        return `
            <div class="candidate-card">
                <h3>${candidate.name}</h3>
                <div class="candidate-id">ID: ${candidate.id}</div>
                <div class="vote-count">${voteCount}</div>
                <p>votes</p>
                <button 
                    class="vote-button" 
                    onclick="castVote('${candidate.id}')"
                    ${votingSystem.votingEnded ? 'disabled' : ''}
                >
                    Vote for ${candidate.name}
                </button>
            </div>
        `;
    }).join('');
}

// Update results chart
function updateResultsChart() {
    if (votingSystem.candidates.length === 0) {
        elements.resultsChart.innerHTML = '<p class="empty-message">No candidates to display.</p>';
        return;
    }
    
    const totalVotes = Object.keys(votingSystem.votes).length;
    
    elements.resultsChart.innerHTML = votingSystem.candidates.map((candidate, index) => {
        const voteCount = getVoteCount(candidate.id);
        const percentage = totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(1) : 0;
        const barWidth = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
        
        return `
            <div class="result-bar">
                <div class="result-header">
                    <div class="candidate-name">${candidate.name}</div>
                    <div class="vote-percentage">${percentage}%</div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${barWidth}%"></div>
                </div>
                <div class="vote-count-text">${voteCount} votes</div>
            </div>
        `;
    }).join('');
}

// Update winner section
function updateWinner() {
    if (!votingSystem.votingEnded) {
        elements.winnerSection.style.display = 'none';
        return;
    }
    
    const winner = getWinner();
    if (winner) {
        elements.winnerSection.style.display = 'block';
        elements.winnerDisplay.innerHTML = `
            <div class="winner-name">${winner.name}</div>
            <div class="winner-votes">Winner with ${winner.votes} votes</div>
        `;
    }
}

// Get vote count for a candidate
function getVoteCount(candidateId) {
    return Object.values(votingSystem.votes).filter(vote => vote === candidateId).length;
}

// Get winner
function getWinner() {
    if (votingSystem.candidates.length === 0) return null;
    
    let maxVotes = 0;
    let winner = null;
    
    votingSystem.candidates.forEach((candidate) => {
        const voteCount = getVoteCount(candidate.id);
        if (voteCount > maxVotes) {
            maxVotes = voteCount;
            winner = candidate;
        }
    });
    
    return winner ? {
        name: winner.name,
        votes: maxVotes
    } : null;
}

// Timer function
function startTimer() {
    setInterval(async () => {
        const now = Date.now();
        if (now >= votingSystem.votingDeadline && !votingSystem.votingEnded) {
            votingSystem.votingEnded = true;
            await saveToIPFS();
            updateUI();
            showMessage('Voting period has ended!', 'success');
        }
        updateStatus();
    }, 1000);
}

// Admin functions
async function addCandidate() {
    const nameInput = document.getElementById('candidate-name');
    const name = nameInput.value.trim();
    
    if (!name) {
        showMessage('Please enter a candidate name.', 'error');
        return;
    }
    
    const newCandidate = {
        id: generateCandidateId(),
        name: name
    };
    
    votingSystem.candidates.push(newCandidate);
    await saveToIPFS();
    updateUI();
    showMessage('Candidate added successfully!', 'success');
    nameInput.value = '';
}

async function addVoter() {
    const nameInput = document.getElementById('voter-name');
    const name = nameInput.value.trim();
    
    if (!name) {
        showMessage('Please enter a voter name.', 'error');
        return;
    }
    
    const newVoter = {
        id: generateVoterId(),
        name: name
    };
    
    votingSystem.voters.push(newVoter);
    await saveToIPFS();
    updateUI();
    showMessage('Voter whitelisted successfully!', 'success');
    nameInput.value = '';
}

async function endVoting() {
    const passwordInput = document.getElementById('admin-password');
    const password = passwordInput.value;
    
    if (password !== votingSystem.adminPassword) {
        showMessage('Incorrect password.', 'error');
        return;
    }
    
    votingSystem.votingEnded = true;
    await saveToIPFS();
    updateUI();
    showMessage('Voting ended!', 'success');
    passwordInput.value = '';
}

async function resetSystem() {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
        votingSystem = {
            candidates: [],
            voters: [],
            votes: {},
            votingEnded: false,
            votingDeadline: Date.now() + (24 * 60 * 60 * 1000),
            adminPassword: 'admin123'
        };
        await saveToIPFS();
        updateUI();
        showMessage('System reset successfully!', 'success');
    }
}

// Voting function
async function castVote(candidateId) {
    if (votingSystem.votingEnded) {
        showMessage('Voting has ended.', 'error');
        return;
    }
    
    const voterIdInput = prompt('Enter your Voter ID (e.g., V1234567890ABC123):');
    if (voterIdInput === null) return;
    const voterId = String(voterIdInput).trim().toUpperCase();
    if (!voterId) {
        showMessage('Voter ID is required.', 'error');
        return;
    }
    
    const voter = findVoterById(voterId);
    if (!voter) {
        showMessage('Invalid Voter ID. Please check your ID and try again.', 'error');
        return;
    }
    
    if (votingSystem.votes.hasOwnProperty(voterId)) {
        showMessage('You have already voted.', 'error');
        return;
    }
    
    // Resolve candidate by ID to avoid array index mistakes
    const candidate = findCandidateById(candidateId);
    if (!candidate) {
        showMessage('Invalid candidate. Please try again.', 'error');
        return;
    }

    // Create vote data for IPFS
    const voteData = {
        voterId: voterId,
        candidateId: candidateId,
        timestamp: Date.now(),
        voterName: voter.name,
        candidateName: candidate.name
    };
    
    try {
        // Save individual vote to IPFS
        const voteHash = await window.ipfsService.saveVote(voteData);
        console.log('Vote saved to IPFS:', voteHash);
        
        // Update main voting system
        votingSystem.votes[voterId] = candidateId;
        await saveToIPFS();
        updateUI();
        showMessage(`Vote cast successfully! Hash: ${voteHash.substring(0, 10)}...`, 'success');
    } catch (error) {
        console.error('Error casting vote:', error);
        showMessage('Vote failed to save to IPFS, using local storage', 'warning');
        votingSystem.votes[voterId] = candidateId;
        saveToStorage();
        updateUI();
        showMessage('Vote cast successfully! (local storage)', 'success');
    }
}

// Utility functions
function validateVoter(voterId) {
    return voterId >= 0 && voterId < votingSystem.voters.length;
}

function validateCandidate(candidateId) {
    return candidateId >= 0 && candidateId < votingSystem.candidates.length;
}

// Generate unique voter ID
function generateVoterId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `V${timestamp}${random}`.toUpperCase();
}

// Generate unique candidate ID
function generateCandidateId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `C${timestamp}${random}`.toUpperCase();
}

// Find voter by ID
function findVoterById(voterId) {
    return votingSystem.voters.find(voter => voter.id === voterId);
}

// Find candidate by ID
function findCandidateById(candidateId) {
    return votingSystem.candidates.find(candidate => candidate.id === candidateId);
}

function getVotingStatistics() {
    const totalVotes = Object.keys(votingSystem.votes).length;
    const totalVoters = votingSystem.voters.length;
    const participationRate = totalVoters > 0 ? ((totalVotes / totalVoters) * 100).toFixed(1) : 0;
    
    return {
        totalVotes,
        totalVoters,
        participationRate,
        remainingVoters: totalVoters - totalVotes
    };
}

async function exportVotingData() {
    const stats = getVotingStatistics();
    const exportData = {
        votingSystem,
        statistics: stats,
        exportTimestamp: Date.now(),
        ipfsHash: localStorage.getItem('votingDataHash')
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `voting-data-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showMessage('Voting data exported successfully!', 'success');
}

async function verifyVoteIntegrity() {
    try {
        const hash = localStorage.getItem('votingDataHash');
        if (!hash) {
            showMessage('No IPFS hash found to verify', 'error');
            return;
        }
        
        const data = await window.ipfsService.retrieveFromIPFS(hash);
        if (data && JSON.stringify(data) === JSON.stringify(votingSystem)) {
            showMessage('✅ Vote integrity verified! Data matches IPFS hash.', 'success');
        } else {
            showMessage('❌ Vote integrity check failed! Data mismatch detected.', 'error');
        }
    } catch (error) {
        console.error('Error verifying vote integrity', error);
        showMessage('Error verifying vote integrity', 'error');
    }
}

// Generate voter cards for printing
function generateVoterCards() {
    if (votingSystem.voters.length === 0) {
        showMessage('No voters to generate cards for', 'error');
        return;
    }
    
    const cardsHTML = votingSystem.voters.map(voter => `
        <div style="
            border: 2px solid #333; 
            padding: 20px; 
            margin: 10px; 
            text-align: center;
            font-family: Arial, sans-serif;
            width: 300px;
            display: inline-block;
        ">
            <h3 style="margin: 0 0 10px 0; color: #333;">🗳️ Voter Card</h3>
            <h4 style="margin: 0 0 15px 0; color: #667eea;">${voter.name}</h4>
            <div style="
                background: #f0f0f0; 
                padding: 10px; 
                border-radius: 5px;
                font-family: 'Courier New', monospace;
                font-size: 14px;
                margin: 10px 0;
            ">
                <strong>Voter ID:</strong><br>
                ${voter.id}
            </div>
            <p style="color: #666; font-size: 12px; margin: 10px 0;">
                Use this ID to cast your vote
            </p>
        </div>
    `).join('');
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Voter Cards</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    @media print { 
                        .no-print { display: none; }
                        body { margin: 0; }
                    }
                </style>
            </head>
            <body>
                <h1 style="text-align: center; color: #333;">🗳️ Voter Cards</h1>
                <div style="text-align: center; margin-bottom: 20px;" class="no-print">
                    <button onclick="window.print()" style="
                        background: #4CAF50; 
                        color: white; 
                        border: none; 
                        padding: 10px 20px; 
                        border-radius: 5px; 
                        cursor: pointer;
                    ">Print Cards</button>
                </div>
                <div style="text-align: center;">
                    ${cardsHTML}
                </div>
            </body>
        </html>
    `);
    printWindow.document.close();
}

// Copy to clipboard function
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showMessage('ID copied to clipboard!', 'success');
    } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showMessage('ID copied to clipboard!', 'success');
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', init); 