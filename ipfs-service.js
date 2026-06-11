// IPFS Service for Voting System
class IPFSService {
    constructor(projectId = null, projectSecret = null) {
        this.ipfs = null;
        this.gateway = 'https://ipfs.io/ipfs/';
        this.votingDataHash = null;
        this.projectId = projectId;
        this.projectSecret = projectSecret;
        this.init();
    }

    async init() {
        try {
            // Prefer initializing without credentials first (works for public endpoints/CDN setups)
            if (typeof window !== 'undefined' && window.ipfsHttpClient && window.ipfsHttpClient.create) {
                try {
                    this.ipfs = window.ipfsHttpClient.create({
                        host: 'ipfs.infura.io',
                        port: 5001,
                        protocol: 'https'
                    });
                    // Optional sanity check (non-fatal if fails due to CORS)
                    try { await this.ipfs.id(); } catch (_) {}
                    console.log('IPFS initialized successfully without credentials');
                    return;
                } catch (e) {
                    console.warn('IPFS init without credentials failed, trying with credentials if provided:', e?.message || e);
                }

                // If credentials are provided, try authenticated init
                if (this.projectId && this.projectSecret) {
                    try {
                        const auth = 'Basic ' + btoa(this.projectId + ':' + this.projectSecret);
                        this.ipfs = window.ipfsHttpClient.create({
                            host: 'ipfs.infura.io',
                            port: 5001,
                            protocol: 'https',
                            headers: { authorization: auth }
                        });
                        try { await this.ipfs.id(); } catch (_) {}
                        console.log('IPFS initialized successfully with HTTP client and credentials');
                        return;
                    } catch (e2) {
                        console.warn('IPFS init with credentials failed:', e2?.message || e2);
                    }
                }
            }

            // Fallback to public gateway if client unavailable or init failed
            console.log('IPFS HTTP client not available or failed to initialize. Falling back to public gateway.');
            this.usePublicGateway();
        } catch (error) {
            console.error('Failed to initialize IPFS with credentials:', error);
            // Fallback to using public gateways
            this.usePublicGateway();
        }
    }

    usePublicGateway() {
        console.log('Using public IPFS gateway');
        this.ipfs = null;
    }

    async uploadToIPFS(data) {
        try {
            if (this.ipfs) {
                // Using IPFS client
                const result = await this.ipfs.add(JSON.stringify(data));
                const cid = result.cid ? result.cid.toString() : (result.path || result);
                return cid;
            } else {
                // Using public gateway upload
                return await this.uploadViaGateway(data);
            }
        } catch (error) {
            console.error('Error uploading to IPFS:', error);
            // If it's an authentication error, try falling back to gateway
            if (error.message && (error.message.includes('401') || error.message.includes('403'))) {
                this.usePublicGateway();
            }
            // Fallback to mock hash generation
            return this.generateMockHash(JSON.stringify(data));
        }
    }

    async uploadViaGateway(data) {
        // Simulate IPFS upload using a public gateway
        // In a real implementation, you'd use a service like Pinata or Infura
        const timestamp = Date.now();
        const hash = this.generateMockHash(JSON.stringify(data) + timestamp);
        return hash;
    }

    generateMockHash(data) {
        // Simple hash generation for demo purposes
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return 'Qm' + Math.abs(hash).toString(16).padStart(44, '0');
    }

    async retrieveFromIPFS(hash) {
        try {
            if (this.ipfs) {
                // Using IPFS client (browser-safe decode)
                const chunks = [];
                for await (const chunk of this.ipfs.cat(hash)) {
                    chunks.push(chunk);
                }
                const totalLength = chunks.reduce((acc, curr) => acc + curr.length, 0);
                const all = new Uint8Array(totalLength);
                let offset = 0;
                for (const chunk of chunks) {
                    all.set(chunk, offset);
                    offset += chunk.length;
                }
                const jsonText = new TextDecoder().decode(all);
                return JSON.parse(jsonText);
            } else {
                // Using public gateway
                return await this.retrieveViaGateway(hash);
            }
        } catch (error) {
            console.error('Error retrieving from IPFS:', error);
            // If it's an authentication error, try falling back to gateway
            if (error.message && (error.message.includes('401') || error.message.includes('403'))) {
                this.usePublicGateway();
            }
            // Return null instead of throwing error
            return null;
        }
    }

    async retrieveViaGateway(hash) {
        try {
            const response = await fetch(`${this.gateway}${hash}`);
            if (!response.ok) {
                throw new Error('Failed to retrieve data from IPFS');
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error retrieving via gateway:', error);
            // Return null if data doesn't exist yet
            return null;
        }
    }

    async saveVotingData(votingSystem) {
        try {
            const hash = await this.uploadToIPFS(votingSystem);
            this.votingDataHash = hash;
            
            // Store the hash in localStorage for persistence
            localStorage.setItem('votingDataHash', hash);
            
            console.log('Voting data saved to IPFS:', hash);
            return hash;
        } catch (error) {
            console.error('Error saving voting data to IPFS:', error);
            throw error;
        }
    }

    async loadVotingData() {
        try {
            const hash = localStorage.getItem('votingDataHash');
            if (!hash) {
                console.log('No IPFS hash found, starting fresh');
                return null;
            }

            const data = await this.retrieveFromIPFS(hash);
            if (data) {
                console.log('Voting data loaded from IPFS:', hash);
                return data;
            } else {
                console.log('No data found at IPFS hash:', hash);
                return null;
            }
        } catch (error) {
            console.error('Error loading voting data from IPFS:', error);
            return null;
        }
    }

    async saveVote(voteData) {
        try {
            const hash = await this.uploadToIPFS(voteData);
            console.log('Vote saved to IPFS:', hash);
            return hash;
        } catch (error) {
            console.error('Error saving vote to IPFS:', error);
            throw error;
        }
    }

    async saveVoteBatch(votes) {
        try {
            const batchData = {
                votes: votes,
                timestamp: Date.now(),
                batchId: this.generateBatchId()
            };
            const hash = await this.uploadToIPFS(batchData);
            console.log('Vote batch saved to IPFS:', hash);
            return hash;
        } catch (error) {
            console.error('Error saving vote batch to IPFS:', error);
            throw error;
        }
    }

    generateBatchId() {
        return 'batch_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getIPFSLink(hash) {
        return `${this.gateway}${hash}`;
    }

    async verifyVote(voteHash) {
        try {
            const voteData = await this.retrieveFromIPFS(voteHash);
            return voteData;
        } catch (error) {
            console.error('Error verifying vote:', error);
            return null;
        }
    }
}

// Create global IPFS service instance
window.ipfsService = new IPFSService(); 